import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // 创建默认用户
  const password = await bcrypt.hash("admin123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      password,
      name: "管理员",
      role: "ADMIN",
      language: "zh",
    },
  });

  const fae = await prisma.user.upsert({
    where: { email: "fae@example.com" },
    update: {},
    create: {
      email: "fae@example.com",
      password,
      name: "FAE工程师",
      role: "FAE",
      language: "zh",
    },
  });

  const sales = await prisma.user.upsert({
    where: { email: "sales@example.com" },
    update: {},
    create: {
      email: "sales@example.com",
      password,
      name: "销售经理",
      role: "SALES",
      language: "zh",
    },
  });

  const rd = await prisma.user.upsert({
    where: { email: "rd@example.com" },
    update: {},
    create: {
      email: "rd@example.com",
      password,
      name: "研发工程师",
      role: "RD",
      language: "zh",
    },
  });

  console.log("Users created:");
  console.log(`  Admin: admin@example.com / admin123`);
  console.log(`  FAE:   fae@example.com / admin123`);
  console.log(`  Sales: sales@example.com / admin123`);
  console.log(`  RD:    rd@example.com / admin123`);

  // 创建邮件收件人默认配置
  const emailRecipients = [
    { role: "FAE_NOTIFY", email: "fae@example.com", name: "FAE工程师" },
    { role: "RD_NOTIFY", email: "rd@example.com", name: "研发工程师" },
    { role: "SALES_NOTIFY", email: "sales@example.com", name: "销售经理" },
  ];

  for (const r of emailRecipients) {
    await prisma.emailRecipient.upsert({
      where: { role_email: { role: r.role, email: r.email } },
      update: {},
      create: r,
    });
  }

  console.log("Email recipients configured.");

  // 创建默认系统配置
  const configs = [
    { key: "firmware_versions", value: JSON.stringify(["v1.0.0", "v1.1.0", "v2.0.0"]) },
    { key: "default_firmware", value: "v2.0.0" },
  ];

  for (const c of configs) {
    await prisma.systemConfig.upsert({
      where: { key: c.key },
      update: {},
      create: c,
    });
  }

  console.log("System configured.");

  // 创建示例 AT 指令参数
  const exampleParams = [
    {
      paramKey: "AT+GSN",
      displayName: "查询IMEI",
      description: "查询设备IMEI号",
      dataType: "STRING" as const,
      isRequired: true,
      defaultValue: "",
      regexPattern: "^[0-9]{15}$",
      regexHint: "请输入15位数字",
      sortOrder: 1,
      groupName: "基本参数",
    },
    {
      paramKey: "AT+CGMI",
      displayName: "制造商信息",
      description: "查询制造商信息",
      dataType: "STRING" as const,
      isRequired: true,
      defaultValue: "IoTManufacturer",
      sortOrder: 2,
      groupName: "基本参数",
    },
    {
      paramKey: "AT+CGMM",
      displayName: "设备型号",
      description: "查询设备型号",
      dataType: "STRING" as const,
      isRequired: true,
      defaultValue: "IoT-Module-A1",
      sortOrder: 3,
      groupName: "基本参数",
    },
    {
      paramKey: "AT+CGMR",
      displayName: "固件版本",
      description: "设备固件版本号",
      dataType: "STRING" as const,
      isRequired: true,
      defaultValue: "v2.0.0",
      sortOrder: 4,
      groupName: "基本参数",
    },
    {
      paramKey: "AT+CGCONTRDP",
      displayName: "APN配置",
      description: "接入点名称",
      dataType: "STRING" as const,
      isRequired: true,
      defaultValue: "iot.nbiot",
      sortOrder: 5,
      groupName: "网络配置",
    },
    {
      paramKey: "AT+CSQ",
      displayName: "信号强度范围(dBm)",
      description: "设置信号强度阈值",
      dataType: "NUMBER" as const,
      isRequired: false,
      defaultValue: "-85",
      unit: "dBm",
      minValue: -120,
      maxValue: -30,
      step: 5,
      sortOrder: 6,
      groupName: "网络配置",
    },
    {
      paramKey: "AT+CGSN",
      displayName: "序列号读取模式",
      description: "设置序列号读取模式",
      dataType: "ENUM" as const,
      isRequired: true,
      defaultValue: "0",
      enumValues: JSON.stringify(["0", "1", "2"]),
      sortOrder: 7,
      groupName: "基本参数",
    },
    {
      paramKey: "AT+CIPADDR",
      displayName: "IP地址",
      description: "设备IP地址",
      dataType: "IP_ADDRESS" as const,
      isRequired: false,
      defaultValue: "192.168.1.100",
      sortOrder: 8,
      groupName: "网络配置",
    },
    {
      paramKey: "AT+CPIN",
      displayName: "SIM卡密码",
      description: "SIM卡PIN码",
      dataType: "STRING" as const,
      isRequired: true,
      defaultValue: "1234",
      regexPattern: "^[0-9]{4,8}$",
      regexHint: "请输入4-8位数字",
      sortOrder: 9,
      groupName: "基本参数",
    },
    {
      paramKey: "AT+CMEE",
      displayName: "错误报告模式",
      description: "设置错误报告级别",
      dataType: "ENUM" as const,
      isRequired: false,
      defaultValue: "1",
      enumValues: JSON.stringify(["0", "1", "2"]),
      sortOrder: 10,
      groupName: "基本参数",
    },
  ];

  console.log("Example AT command parameters ready.");
  console.log("\nSeed completed! You can now run:");
  console.log("  npm run dev    # Start development server");
  console.log("  npx prisma studio   # Open database browser");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
