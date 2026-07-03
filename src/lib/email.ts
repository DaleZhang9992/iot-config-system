import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;

let resend: Resend | null = null;
if (resendApiKey) {
  resend = new Resend(resendApiKey);
}

export interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams) {
  const from = process.env.EMAIL_FROM || "noreply@iot-config.com";

  if (resend) {
    const result = await resend.emails.send({
      from,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    });
    return result;
  }

  // 如果没有配置邮件服务，打印到控制台
  console.log("=== EMAIL (no service configured) ===");
  console.log("To:", to);
  console.log("Subject:", subject);
  console.log("Body:", html);
  console.log("===================================");
  return { data: null, error: null };
}

// 邮件模板
export function emailLayout(content: string, lang: "zh" | "en" = "zh") {
  const appName = lang === "zh" ? "IoT 生产配置系统" : "IoT Production Config System";
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
    <h2 style="margin: 0;">${appName}</h2>
  </div>
  <div style="background: #f9fafb; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
    ${content}
  </div>
</body>
</html>`;
}

export function customerLinkEmail(params: {
  orderNo: string;
  customerName: string;
  link: string;
  lang: "zh" | "en";
}) {
  const { orderNo, customerName, link, lang } = params;
  const title = lang === "zh" ? "您的设备配置已就绪" : "Your Device Configuration is Ready";
  const body =
    lang === "zh"
      ? `
    <p>尊敬的 ${customerName}，您好！</p>
    <p>订单 <strong>${orderNo}</strong> 的生产配置已准备完成。</p>
    <p>请点击下方按钮填写配置信息：</p>
    <a href="${link}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">填写配置</a>
    <p style="color: #6b7280; font-size: 14px;">如果按钮无法点击，请复制以下链接到浏览器：<br/>${link}</p>`
      : `
    <p>Dear ${customerName},</p>
    <p>The production configuration for Order <strong>${orderNo}</strong> is ready.</p>
    <p>Please click the button below to fill in the configuration:</p>
    <a href="${link}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">Fill Configuration</a>
    <p style="color: #6b7280; font-size: 14px;">If the button doesn't work, copy this link to your browser:<br/>${link}</p>`;

  return emailLayout(body, lang);
}

export function notifyFaeEmail(params: {
  orderNo: string;
  customerName: string;
  submissionUrl: string;
  lang: "zh" | "en";
}) {
  const { orderNo, customerName, submissionUrl, lang } = params;
  const title = lang === "zh" ? "新的配置提交待审核" : "New Configuration Submission Pending Review";
  const body =
    lang === "zh"
      ? `
    <p>客户 <strong>${customerName}</strong> 已提交订单 ${orderNo} 的配置。</p>
    <p>请点击下方链接进行审核：</p>
    <a href="${submissionUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">审核配置</a>`
      : `
    <p>Customer <strong>${customerName}</strong> has submitted configuration for Order ${orderNo}.</p>
    <p>Please review via the link below:</p>
    <a href="${submissionUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">Review Configuration</a>`;

  return emailLayout(body, lang);
}

export function approvedEmail(params: {
  orderNo: string;
  model: string;
  viewUrl: string;
  lang: "zh" | "en";
}) {
  const { orderNo, model, viewUrl, lang } = params;
  const body =
    lang === "zh"
      ? `
    <p>订单 <strong>${orderNo}</strong>（型号：${model}）的生产配置已审批通过。</p>
    <p>请点击下方链接查看详细配置：</p>
    <a href="${viewUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">查看配置</a>`
      : `
    <p>The production configuration for Order <strong>${orderNo}</strong> (Model: ${model}) has been approved.</p>
    <p>Click the link below to view details:</p>
    <a href="${viewUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">View Configuration</a>`;

  return emailLayout(body, lang);
}

export function rejectedEmail(params: {
  orderNo: string;
  customerName: string;
  comment: string;
  link: string;
  lang: "zh" | "en";
}) {
  const { orderNo, customerName, comment, link, lang } = params;
  const body =
    lang === "zh"
      ? `
    <p>尊敬的 ${customerName}，您好！</p>
    <p>订单 ${orderNo} 的配置需要修改：</p>
    <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 16px; border-radius: 6px; margin: 12px 0;">
      <p style="color: #dc2626; font-weight: bold;">审核意见：</p>
      <p style="color: #333;">${comment}</p>
    </div>
    <p>请点击下方链接修改并重新提交：</p>
    <a href="${link}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">修改配置</a>`
      : `
    <p>Dear ${customerName},</p>
    <p>The configuration for Order ${orderNo} needs revision:</p>
    <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 16px; border-radius: 6px; margin: 12px 0;">
      <p style="color: #dc2626; font-weight: bold;">Review Comments:</p>
      <p style="color: #333;">${comment}</p>
    </div>
    <p>Please click the link below to modify and resubmit:</p>
    <a href="${link}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">Modify Configuration</a>`;

  return emailLayout(body, lang);
}
