import cron from "node-cron";
import { Op } from "sequelize";
import { sendEmail } from "../utils/email.js";
import { Task, User, Lead } from "../models/index.js";

/**
 * Core function to query tasks and dispatch email summaries.
 * Can be called manually via API route or automatically via node-cron.
 */
export const runOverdueTaskCheck = async () => {
  try {
    console.log("⏰ Running task check for overdue, upcoming, and newly created tasks...");

    // 1. Calculate End of Tomorrow (23:59:59 tomorrow)
    const endOfTomorrow = new Date();
    endOfTomorrow.setDate(endOfTomorrow.getDate() + 1);
    endOfTomorrow.setHours(23, 59, 59, 999);

    // 2. Calculate 24-Hour Window for Newly Created Tasks
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // 3. Query Pending Tasks: Past Overdue OR Due Tomorrow OR Created in Last 24 Hours
    const tasks = await Task.findAll({
      where: {
        status: {
          [Op.notIn]: ["completed", "done"],
        },
        [Op.or]: [
          {
            // Captures past overdue tasks AND tasks due up to tomorrow
            dueDate: {
              [Op.lte]: endOfTomorrow,
            },
          },
          {
            // Captures newly created tasks
            createdAt: {
              [Op.gte]: twentyFourHoursAgo,
            },
          },
        ],
      },
      include: [
        {
          model: User,
          as: "assignedUser",
          attributes: ["id", "name", "email"],
        },
        {
          model: Lead,
          as: "lead",
          attributes: ["id", "title", "contactName", "companyName"],
          include: [
            {
              model: User,
              as: "assignedUser",
              attributes: ["id", "name", "email"],
            },
          ],
        },
      ],
    });

    console.log(`Found ${tasks.length} task(s) matching criteria.`);
    if (tasks.length === 0) {
      return { success: true, processedUsers: 0, emailsSent: 0, message: "No pending tasks found." };
    }

    // 4. Group tasks by Recipient User ID (Direct Assignee or Lead Owner)
    const userTasksMap = new Map();

    for (const task of tasks) {
      const recipient = task.assignedUser || task.lead?.assignedUser;
      if (!recipient || !recipient.email) continue;

      if (!userTasksMap.has(recipient.id)) {
        userTasksMap.set(recipient.id, {
          user: recipient,
          tasks: [],
        });
      }
      userTasksMap.get(recipient.id).tasks.push(task);
    }

    // 5. Send aggregated summary email to each user
    let sentCount = 0;
    const startOfToday = new Date().setHours(0, 0, 0, 0);

    for (const { user, tasks: userTasks } of userTasksMap.values()) {
      try {
        const taskRowsHtml = userTasks
          .map((t) => {
            const leadName = t.lead ? (t.lead.title || t.lead.companyName || "N/A") : "No Lead Assigned";
            const formattedDueDate = t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "No Due Date";

            // Determine Badges
            const isOverdue = t.dueDate && new Date(t.dueDate).getTime() < startOfToday;
            const isNewlyCreated = new Date(t.createdAt) >= twentyFourHoursAgo;

            let badge = "";
            if (isOverdue) {
              badge = `<span style="background:#fef2f2;color:#dc2626;padding:2px 6px;border-radius:4px;font-size:11px;font-weight:bold;margin-left:6px;">OVERDUE</span>`;
            } else if (isNewlyCreated) {
              badge = `<span style="background:#e0f2fe;color:#0369a1;padding:2px 6px;border-radius:4px;font-size:11px;font-weight:bold;margin-left:6px;">NEW</span>`;
            }

            return `
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 10px; font-weight: bold; color: #1e293b;">${t.title} ${badge}</td>
                <td style="padding: 10px; color: #475569;">${leadName}</td>
                <td style="padding: 10px; color: #64748b;">${formattedDueDate}</td>
                <td style="padding: 10px; text-transform: capitalize; color: #0284c7;">${t.priority || "Medium"}</td>
              </tr>
            `;
          })
          .join("");

        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 650px; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; margin: 0 auto;">
            <h2 style="color: #0f172a; margin-top: 0;">Task Digest & Attention Summary</h2>
            <p style="color: #334155;">Hello <strong>${user.name || "User"}</strong>,</p>
            <p style="color: #334155;">You have <strong>${userTasks.length} task(s)</strong> that are overdue, newly created, or due tomorrow:</p>
            
            <table style="width: 100%; border-collapse: collapse; text-align: left; margin: 15px 0;">
              <thead>
                <tr style="background-color: #f8fafc; border-bottom: 2px solid #e2e8f0;">
                  <th style="padding: 8px; color: #475569;">Task</th>
                  <th style="padding: 8px; color: #475569;">Lead</th>
                  <th style="padding: 8px; color: #475569;">Due Date</th>
                  <th style="padding: 8px; color: #475569;">Priority</th>
                </tr>
              </thead>
              <tbody>
                ${taskRowsHtml}
              </tbody>
            </table>

            <p style="color: #64748b; font-size: 13px; margin-top: 20px;">
              Please log in to your CRM dashboard to process or resolve these items.
            </p>
          </div>
        `;

        await sendEmail({
          to: user.email,
          subject: `⚠️ CRM Action Required: You have ${userTasks.length} task(s) requiring attention`,
          html: emailHtml,
        });

        sentCount++;
        console.log(`✅ Digest sent to ${user.email} (${userTasks.length} tasks).`);
      } catch (mailError) {
        console.error(`❌ Failed to send email to ${user.email}:`, mailError);
      }
    }

    return {
      success: true,
      processedUsers: userTasksMap.size,
      emailsSent: sentCount,
    };
  } catch (error) {
    console.error("❌ Error in runOverdueTaskCheck:", error);
    throw error;
  }
};

/**
 * Initializes local cron schedule.
 * Example schedule: "10 11 * * *" = 11:10 AM daily
 */
export const initOverdueTaskCron = () => {
  cron.schedule("10 11 * * *", async () => {
    await runOverdueTaskCheck();
  });
};