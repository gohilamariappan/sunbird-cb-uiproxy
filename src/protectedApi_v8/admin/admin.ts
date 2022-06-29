import { Router } from 'express'
import { bannerApi } from './banner'
import { userRegistrationApi } from './userRegistration'
import { bulkUploadUserApi } from './bulkUploadUser'
import { userRolesApi } from './userRoles'

export const admin = Router()

admin.use('/userRegistration', userRegistrationApi)
admin.use('/bulk-upload', bulkUploadUserApi)
admin.use('/banners', bannerApi)
admin.use('/userRoles', userRolesApi)
