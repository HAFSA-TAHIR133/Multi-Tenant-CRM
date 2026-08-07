import cron from "node-cron";
import { Op } from "sequelize";
import { sendEmail } from "../utils/email.js";
import { Task, User } from "../models/index.js"; 

// Run every day at 11:20 AM
export const initOverdueTaskCron = () => {
  cron.schedule("0 17 * * *", async () => {
    try {
      console.log("Running background check for tasks due today...");

      // Define today's time window (00:00:00 to 23:59:59)
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      const endOfToday = new Date(startOfToday);
      endOfToday.setDate(endOfToday.getDate() + 1);

      // 1. Fetch tasks due today that are pending/incomplete
      const pendingTasks = await Task.findAll({
        where: {
          dueDate: {
            [Op.gte]: startOfToday,
            [Op.lt]: endOfToday,
          },
          status: {
            [Op.notIn]: ["completed", "done"],
          },
          assignedUserId: {
            [Op.ne]: null,
          },
        },
        include: [
          {
            model: User,
            as: "assignedUser",
            attributes: ["id", "name", "email"],
          },
        ],
      });

      console.log(`Found ${pendingTasks.length} tasks due today.`);
      if (pendingTasks.length === 0) return;

      // 2. Group tasks by User ID
      const userTasksMap = new Map();

      for (const task of pendingTasks) {
        const user = task.assignedUser;
        if (!user || !user.email) continue;

        if (!userTasksMap.has(user.id)) {
          userTasksMap.set(user.id, {
            user,
            tasks: [],
          });
        }
        userTasksMap.get(user.id).tasks.push(task);
      }

      // 3. Send one aggregated email per user
      for (const { user, tasks } of userTasksMap.values()) {
        try {
          const taskListHtml = tasks
            .map((t) => `<li><strong>${t.title}</strong></li>`)
            .join("");

          const taskListText = tasks
            .map((t) => `- ${t.title}`)
            .join("\n");

          await sendEmail({
            to: user.email,
            subject: `⚠️ Reminder: You have ${tasks.length} task(s) due today!`,
            text: `Hello ${user.name || "User"},\n\nThis is a reminder that the following task(s) are due today:\n\n${taskListText}\n\nPlease log in to complete them.\n\nThank you!`,
            html: `
              <div style="font-family: sans-serif; padding: 20px;">
                <h2>Hello ${user.name || "User"},</h2>
                <p>This is a reminder that you have <strong>${tasks.length} task(s)</strong> due today:</p>
                <ul>
                  ${taskListHtml}
                </ul>
                <p>Please log in to your dashboard to complete or update your pending tasks.</p>
              </div>
            `,
          });

          console.log(`Summary notification sent to ${user.email} for ${tasks.length} task(s).`);
        } catch (mailError) {
          console.error(`Failed to send email to ${user.email}:`, mailError);
        }
      }
    } catch (error) {
      console.error("Error in task reminder cron job:", error);
    }
  });
};