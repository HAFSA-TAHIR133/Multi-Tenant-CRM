await PipelineAssignment.bulkCreate([
  { pipelineId: 1, userId: 5, assignedBy: adminId },
  { pipelineId: 1, userId: 6, assignedBy: adminId },
]);