# Task Progress - Fix Create Lead Dialog

## Issues Found:
1. **AddLeadDialog.jsx** sent wrong field names (`name` instead of `contactName`, `company` instead of `companyName`) and was missing required fields (`title`, `pipelineId`, `stageId`)
2. **EditLeadDialog.jsx** had the same field name mismatch
3. **leadSchema.js** didn't match backend expectations
4. **pipelinesApi.jsx** had broken `create`, `update`, `createStage`, `updateStage`, `deleteStage`, `remove` methods (passed data directly instead of wrapping in `{ method, body }`)
5. Backend `createLead` requires `title`, `pipelineId`, `stageId` - none were sent from frontend

## Changes Made:
- [x] Analyze all relevant files
- [x] Fix `leadSchema.js` - aligned field names with backend (`name`→`contactName`, `company`→`companyName`, added `title`, `pipelineId`, `stageId`, `website`, `value`)
- [x] Rewrite `AddLeadDialog.jsx` - added pipeline/stage selection with create-new-pipeline option
- [x] Rewrite `EditLeadDialog.jsx` - same pipeline/stage support
- [x] Fix `pipelinesApi.jsx` - all CRUD methods now properly wrap data in `{ method, body }`
- [x] Build verified - zero errors