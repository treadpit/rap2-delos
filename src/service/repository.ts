import { Repository, RepositoriesMembers, Interface, Property, Module } from '../models'
import { MoveOp } from '../models/bo/interface'
import RedisService, { CACHE_KEY } from '../service/redis'
import { AccessUtils, ACCESS_TYPE } from '../routes/utils/access'
import OrganizationService from './organization'

export default class RepositoryService {
  public static async canUserAccessRepository(
    userId: number,
    repositoryId: number,
    token?: string,
  ): Promise<boolean> {
    const repo = await Repository.findByPk(repositoryId)
    if (token && repo.token === token) return true
    if (!repo) return false
    if (repo.ownerId === userId) return true
    const memberExistsNum = await RepositoriesMembers.count({
      where: {
        userId,
        repositoryId,
      },
    })
    if (memberExistsNum > 0) return true
    return OrganizationService.canUserAccessOrganization(userId, repo.organizationId)
  }

  public static async canUserMoveInterface(
    userId: number,
    itfId: number,
    destRepoId: number,
    destModuleId: number,
  ) {
    return (
      AccessUtils.canUserAccess(ACCESS_TYPE.INTERFACE_GET, userId, itfId) &&
      AccessUtils.canUserAccess(ACCESS_TYPE.REPOSITORY_SET, userId, destRepoId) &&
      AccessUtils.canUserAccess(ACCESS_TYPE.MODULE_SET, userId, destModuleId)
    )
  }

  public static async canUserMoveModule(userId: number, modId: number, destRepoId: number) {
    return (
      AccessUtils.canUserAccess(ACCESS_TYPE.MODULE_GET, userId, modId) &&
      AccessUtils.canUserAccess(ACCESS_TYPE.REPOSITORY_SET, userId, destRepoId)
    )
  }

  public static async moveModule(op: MoveOp, modId: number, destRepoId: number, nameSuffix = '副本') {
    const mod = await Module.findByPk(modId)
    const fromRepoId = mod.repositoryId
    if (op === MoveOp.MOVE) {
      mod.repositoryId = destRepoId
      await mod.save()
      await Interface.update(
        {
          repositoryId: destRepoId,
        },
        {
          where: {
            moduleId: modId,
          },
        },
      )
      await Property.update(
        {
          repositoryId: destRepoId,
        },
        {
          where: {
            moduleId: modId,
          },
        },
      )
    } else if (op === MoveOp.COPY) {
      const { id, name, ...otherProps } = mod.toJSON() as Module
      const interfaces = await Interface.findAll({
        where: {
          moduleId: modId,
        },
      })
      const newMod = await Module.create({
        name: mod.name + nameSuffix,
        ...otherProps,
        repositoryId: destRepoId,
      })
      const promises = interfaces.map(itf =>
        RepositoryService.moveInterface(MoveOp.COPY, itf.id, destRepoId, newMod.id, ''),
      )
      await Promise.all(promises)
    }
    await Promise.all([
      RedisService.delCache(CACHE_KEY.REPOSITORY_GET, fromRepoId),
      RedisService.delCache(CACHE_KEY.REPOSITORY_GET, destRepoId),
    ])
  }

  public static async moveInterface(
    op: MoveOp,
    itfId: number,
    destRepoId: number,
    destModuleId: number,
    nameSuffix = '副本'
  ) {
    const itf = await Interface.findByPk(itfId)
    const fromRepoId = itf.repositoryId
    if (op === MoveOp.MOVE) {
      itf.moduleId = destModuleId
      itf.repositoryId = destRepoId
      await Property.update(
        {
          moduleId: destModuleId,
          repositoryId: destRepoId,
        },
        {
          where: {
            interfaceId: itf.id,
          },
        },
      )
      await itf.save()
    } else if (op === MoveOp.COPY) {
      const { id, name, ...otherProps } = itf.toJSON() as Interface
      const newItf = await Interface.create({
        name: name + nameSuffix,
        ...otherProps,
        repositoryId: destRepoId,
        moduleId: destModuleId,
      })

      const properties = await Property.findAll({
        where: {
          interfaceId: itf.id,
        },
        order: [['parentId', 'asc']],
      })
      // 解决parentId丢失的问题
      let idMap: any = {}
      for (const property of properties) {
        const { id, parentId, ...props } = property.toJSON() as Property
        const newParentId = idMap[parentId + ''] ? idMap[parentId + ''] : -1
        const newProperty = await Property.create({
          ...props,
          interfaceId: newItf.id,
          parentId: newParentId,
          repositoryId: destRepoId,
          moduleId: destModuleId,
        })
        idMap[id + ''] = newProperty.id
      }
    }
    await Promise.all([
      RedisService.delCache(CACHE_KEY.REPOSITORY_GET, fromRepoId),
      RedisService.delCache(CACHE_KEY.REPOSITORY_GET, destRepoId),
    ])
  }
}
