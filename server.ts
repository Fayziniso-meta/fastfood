import 'dotenv/config';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import type {
  AddonOption,
  DeliveryType,
  KitchenSettings,
  MenuCategory,
  MenuItem,
  Order,
  OrderItemPayload,
  OrderStatus,
  PaymentMethod,
  TelegramLogEntry,
} from './src/types.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const TELEGRAM_BOT_TOKEN =
  process.env.TELEGRAM_BOT_TOKEN || '9006250704:AAEvNmpM8MM0tHKBPILaygsJNY3u_LBBsUA';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '-1003963771527';
const ADMIN_PIN = process.env.ADMIN_PIN || '2026';

const DATA_DIR = path.resolve(__dirname, 'data');
const DB_PATH = path.join(DATA_DIR, 'db.json');

interface DatabaseSchema {
  orderCounter: number;
  menu: MenuItem[];
  orders: Order[];
  settings: KitchenSettings;
  telegramLogs: TelegramLogEntry[];
}

const IMG_HERO_BURGER = '/src/assets/images/hero_fire_burger_1795065218865.jpg';
const IMG_CLASSIC_BURGER = '/src/assets/images/menu_classic_burger_1795065218986.jpg';
const IMG_LAVASH = '/src/assets/images/menu_chicken_lavash_1795065219051.jpg';
const IMG_PIZZA = '/src/assets/images/menu_pepperoni_pizza_1795065217846.jpg';
const IMG_CHICKEN = '/src/assets/images/menu_crispy_chicken_1795065217779.jpg';
const IMG_DRINKS = '/src/assets/images/menu_combo_drinks_1795065218752.jpg';

const INITIAL_MENU: MenuItem[] = [
  {
    id: 'item-olov-double',
    name: 'Olov Double Smash Burger',
    category: 'Burgerlar',
    description:
      'Ikki qavatli 100% mol go‘shti kotleti, eritilgan chedder pishlog‘i, qovurilgan piyoz, tuzlangan bodring va maxsus olov sousi.',
    price: 54000,
    weight: '340 g',
    image: IMG_HERO_BURGER,
    available: true,
    popular: true,
    spicy: true,
    prepMinutes: 12,
  },
  {
    id: 'item-classic-cheese',
    name: 'Klassik Chizburger',
    category: 'Burgerlar',
    description:
      'Olovda pishirilgan mol go‘shti kotleti, yangi pomidor, aysberg salati, chedder pishlog‘i va qaymoqli gril sousi.',
    price: 39000,
    weight: '260 g',
    image: IMG_CLASSIC_BURGER,
    available: true,
    popular: true,
    spicy: false,
    prepMinutes: 10,
  },
  {
    id: 'item-smoky-bbq',
    name: 'Smoky BBQ Mol Go‘shtli Burger',
    category: 'Burgerlar',
    description:
      'Dudlangan barbekyu sousi, ikki karra chedder, qarsildoq piyoz halqalari va yumshoq briosh bulochka.',
    price: 48000,
    weight: '310 g',
    image: IMG_CLASSIC_BURGER,
    available: true,
    popular: false,
    spicy: false,
    prepMinutes: 12,
  },
  {
    id: 'item-tovuq-lavash',
    name: 'Gril Tovuqli Lavash',
    category: 'Lavash va Donar',
    description:
      'Qarsildoq qovurilgan yupqa lavash ichida olovda pishgan tovuq filesi, kartoshka fri, yangi sabzavotlar va sarimsoqli sous.',
    price: 34000,
    weight: '320 g',
    image: IMG_LAVASH,
    available: true,
    popular: true,
    spicy: false,
    prepMinutes: 8,
  },
  {
    id: 'item-pishloqli-lavash',
    name: 'Olovli Pishloqli Mol Lavash',
    category: 'Lavash va Donar',
    description:
      'Mayin mol go‘shti, ikki xil eritilgan pishloq, achchiq jalapeno, pomidor va maxsus olovrang sous.',
    price: 42000,
    weight: '360 g',
    image: IMG_LAVASH,
    available: true,
    popular: true,
    spicy: true,
    prepMinutes: 10,
  },
  {
    id: 'item-pepperoni-pitsa',
    name: 'Pepperoni Pitsa (32 sm)',
    category: 'Pitsa',
    description:
      'Yupqa italyan xamiri, mol go‘shtli pepperoni kolbasasi, cho‘ziluvchan motsarella pishlog‘i va uy tomat sousi.',
    price: 89000,
    weight: '640 g',
    image: IMG_PIZZA,
    available: true,
    popular: true,
    spicy: false,
    prepMinutes: 18,
  },
  {
    id: 'item-diablo-pitsa',
    name: 'Olov Diablo Pitsa (32 sm)',
    category: 'Pitsa',
    description:
      'Achchiq pepperoni, grilda pishgan mol go‘shti, jalapeno qalampiri, qizil piyoz va motsarella pishlog‘i.',
    price: 96000,
    weight: '680 g',
    image: IMG_PIZZA,
    available: true,
    popular: false,
    spicy: true,
    prepMinutes: 18,
  },
  {
    id: 'item-crispy-wings',
    name: 'Qarsildoq Tovuq Qanotchalari (8 dona)',
    category: 'Tovuq va Fri',
    description:
      'Ziravorli oltin qobiqda qovurilgan 8 dona qarsildoq qanotcha va olovrang chili-sarimsoq sousi.',
    price: 46000,
    weight: '380 g',
    image: IMG_CHICKEN,
    available: true,
    popular: true,
    spicy: true,
    prepMinutes: 12,
  },
  {
    id: 'item-strips-fri',
    name: 'Tovuq Strips va Katta Fri',
    category: 'Tovuq va Fri',
    description:
      '5 dona yumshoq tovuq filesi stripslari, ziravorlangan oltin kartoshka fri va ikki xil firma sousi.',
    price: 44000,
    weight: '350 g',
    image: IMG_CHICKEN,
    available: true,
    popular: false,
    spicy: false,
    prepMinutes: 10,
  },
  {
    id: 'item-kombo-olov',
    name: 'Olov Kombo (1 kishilik)',
    category: 'Kombo',
    description:
      'Olov Double Smash Burger + o‘rtacha kartoshka fri + 0.5L muzdek kola + maxsus olov sousi.',
    price: 74000,
    weight: '720 g',
    image: IMG_HERO_BURGER,
    available: true,
    popular: true,
    spicy: false,
    prepMinutes: 14,
  },
  {
    id: 'item-kombo-dostlar',
    name: 'Do‘stlar Seti (3–4 kishilik)',
    category: 'Kombo',
    description:
      'Pepperoni Pitsa (32 sm) + 2 dona Gril Lavash + 8 dona qarsildoq qanotcha + 2 ta sitrus limonad.',
    price: 189000,
    weight: '1.9 kg',
    image: IMG_PIZZA,
    available: true,
    popular: true,
    spicy: false,
    prepMinutes: 22,
  },
  {
    id: 'item-citrus-limonad',
    name: 'Muzdek Apelsin Limonad & Kola',
    category: 'Ichimliklar',
    description:
      'Yangi siqilgan apelsin, yalpiz barglari va muz bo‘laklari bilan tayyorlangan tetiklantiruvchi firma ichimligi (0.5L).',
    price: 18000,
    weight: '500 ml',
    image: IMG_DRINKS,
    available: true,
    popular: false,
    spicy: false,
    prepMinutes: 3,
  },
];

const INITIAL_SETTINGS: KitchenSettings = {
  kitchenOpen: true,
  deliveryFee: 15000,
  freeDeliveryThreshold: 100000,
  workHours: '10:00 – 02:00',
  phone: '+998 71 200 45 45',
  address: 'Toshkent sh., Amir Temur shoh ko‘chasi, 48-uy',
};

function ensureDb(): DatabaseSchema {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_PATH)) {
    const initial: DatabaseSchema = {
      orderCounter: 1000,
      menu: INITIAL_MENU,
      orders: [],
      settings: INITIAL_SETTINGS,
      telegramLogs: [],
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2), 'utf-8');
    return initial;
  }
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<DatabaseSchema>;
    return {
      orderCounter: typeof parsed.orderCounter === 'number' ? parsed.orderCounter : 1000,
      menu: Array.isArray(parsed.menu) && parsed.menu.length > 0 ? parsed.menu : INITIAL_MENU,
      orders: Array.isArray(parsed.orders) ? parsed.orders : [],
      settings: { ...INITIAL_SETTINGS, ...(parsed.settings || {}) },
      telegramLogs: Array.isArray(parsed.telegramLogs) ? parsed.telegramLogs : [],
    };
  } catch {
    const fallback: DatabaseSchema = {
      orderCounter: 1000,
      menu: INITIAL_MENU,
      orders: [],
      settings: INITIAL_SETTINGS,
      telegramLogs: [],
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(fallback, null, 2), 'utf-8');
    return fallback;
  }
}

let db: DatabaseSchema = ensureDb();

function saveDb() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
}

function escapeHtml(text: string): string {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function formatMoney(amount: number): string {
  return `${Math.round(amount).toLocaleString('ru-RU').replace(/,/g, ' ')} so'm`;
}

function formatTashkentTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat('uz-UZ', {
      timeZone: 'Asia/Tashkent',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  cash: 'Naqd pul',
  card: 'Bank kartasi (Terminal)',
  click_payme: 'Click / Payme',
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  new: 'Yangi buyurtma',
  preparing: 'Tayyorlanmoqda',
  delivering: 'Kuryer yo‘lda',
  completed: 'Yetkazildi / Yakunlandi',
  cancelled: 'Bekor qilindi',
};

function buildOrderTelegramMessage(order: Order): string {
  const deliveryText =
    order.deliveryType === 'delivery'
      ? `Yetkazib berish\n📍 <b>Manzil:</b> ${escapeHtml(order.address)}`
      : `O‘zi olib ketadi (Oshxonadan)`;

  const itemLines = order.items
    .map((item, idx) => {
      const addonText =
        item.addons && item.addons.length > 0
          ? `\n     + ${item.addons.map((a) => escapeHtml(a.name)).join(', ')}`
          : '';
      return `${idx + 1}. <b>${escapeHtml(item.name)}</b> × ${item.quantity} — <code>${formatMoney(
        item.lineTotal
      )}</code>${addonText}`;
    })
    .join('\n');

  const lines = [
    `🔥 <b>YANGI BUYURTMA ${escapeHtml(order.orderNumber)}</b>`,
    `🕒 <b>Vaqt:</b> ${escapeHtml(formatTashkentTime(order.createdAt))}`,
    ``,
    `👤 <b>Mijoz:</b> ${escapeHtml(order.customerName)}`,
    `📞 <b>Telefon:</b> ${escapeHtml(order.customerPhone)}`,
    `🚚 <b>Usul:</b> ${deliveryText}`,
    `💳 <b>To‘lov:</b> ${PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod}`,
    ``,
    `🍔 <b>Buyurtma tarkibi:</b>`,
    itemLines,
    ``,
    `📦 <b>Mahsulotlar:</b> <code>${formatMoney(order.subtotal)}</code>`,
    `🛵 <b>Yetkazish:</b> <code>${
      order.deliveryFee === 0 ? 'Bepul' : formatMoney(order.deliveryFee)
    }</code>`,
    `💰 <b>JAMI SUMMA:</b> <b>${formatMoney(order.total)}</b>`,
  ];

  if (order.comment && order.comment.trim()) {
    lines.push(``, `📝 <b>Izoh:</b> ${escapeHtml(order.comment.trim())}`);
  }

  return lines.join('\n');
}

async function sendTelegramMessage(
  text: string,
  replyToMessageId?: number
): Promise<{ ok: boolean; messageId?: number; error?: string }> {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    return { ok: false, error: 'Telegram bot token yoki kanal ID sozlanmagan' };
  }

  try {
    const endpoint = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const payload: Record<string, unknown> = {
      chat_id: TELEGRAM_CHAT_ID,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    };
    if (replyToMessageId) {
      payload.reply_to_message_id = replyToMessageId;
    }

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = (await res.json()) as {
      ok: boolean;
      result?: { message_id?: number };
      description?: string;
    };

    if (!data.ok) {
      return {
        ok: false,
        error: data.description || `Telegram API xatosi (HTTP ${res.status})`,
      };
    }

    return { ok: true, messageId: data.result?.message_id };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Tarmoq xatosi',
    };
  }
}

function recordTelegramLog(entry: Omit<TelegramLogEntry, 'id' | 'timestamp'>) {
  db.telegramLogs.unshift({
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    ...entry,
  });
  if (db.telegramLogs.length > 50) {
    db.telegramLogs = db.telegramLogs.slice(0, 50);
  }
  saveDb();
}

// In-memory admin sessions
const adminTokens = new Set<string>();

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const token = req.header('x-admin-token');
  if (!token || !adminTokens.has(token)) {
    res.status(401).json({ error: 'Admin avtorizatsiyasi talab qilinadi' });
    return;
  }
  next();
}

const VALID_CATEGORIES: MenuCategory[] = [
  'Burgerlar',
  'Lavash va Donar',
  'Pitsa',
  'Tovuq va Fri',
  'Kombo',
  'Ichimliklar',
];

const VALID_STATUSES: OrderStatus[] = [
  'new',
  'preparing',
  'delivering',
  'completed',
  'cancelled',
];

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  // Public API: Menu & Kitchen Settings
  app.get('/api/menu', (_req, res) => {
    res.json({ menu: db.menu });
  });

  app.get('/api/settings', (_req, res) => {
    res.json({ settings: db.settings });
  });

  // Public API: Track order by orderNumber
  app.get('/api/orders/track/:orderNumber', (req, res) => {
    const query = req.params.orderNumber.trim().toUpperCase().replace(/^#/, '');
    const found = db.orders.find(
      (o) => o.orderNumber.toUpperCase().replace(/^#/, '') === query
    );
    if (!found) {
      res.status(404).json({ error: 'Bunday raqamli buyurtma topilmadi' });
      return;
    }
    res.json({
      order: {
        orderNumber: found.orderNumber,
        status: found.status,
        createdAt: found.createdAt,
        updatedAt: found.updatedAt,
        deliveryType: found.deliveryType,
        items: found.items,
        total: found.total,
        telegramSent: found.telegramSent,
      },
    });
  });

  // Public API: Create Order + Send Real-Time to Telegram Channel
  app.post('/api/orders', async (req, res) => {
    try {
      const body = req.body as {
        customerName?: string;
        customerPhone?: string;
        deliveryType?: DeliveryType;
        address?: string;
        paymentMethod?: PaymentMethod;
        comment?: string;
        items?: Array<{
          menuItemId: string;
          quantity: number;
          addons?: AddonOption[];
        }>;
      };

      if (!db.settings.kitchenOpen) {
        res
          .status(400)
          .json({ error: 'Oshxona hozircha yopiq. Tez orada qayta ochiladi.' });
        return;
      }

      const customerName = (body.customerName || '').trim();
      const customerPhone = (body.customerPhone || '').trim();
      const deliveryType: DeliveryType =
        body.deliveryType === 'pickup' ? 'pickup' : 'delivery';
      const address = (body.address || '').trim();
      const paymentMethod: PaymentMethod =
        body.paymentMethod === 'card' || body.paymentMethod === 'click_payme'
          ? body.paymentMethod
          : 'cash';
      const comment = (body.comment || '').trim();

      if (customerName.length < 2) {
        res.status(400).json({ error: 'Iltimos, ismingizni kiriting' });
        return;
      }
      if (customerPhone.replace(/\D/g, '').length < 9) {
        res.status(400).json({ error: 'Telefon raqamingizni to‘liq kiriting' });
        return;
      }
      if (deliveryType === 'delivery' && address.length < 5) {
        res.status(400).json({ error: 'Yetkazib berish manzilini kiriting' });
        return;
      }
      if (!Array.isArray(body.items) || body.items.length === 0) {
        res.status(400).json({ error: 'Savat bo‘sh. Kamida bitta taom tanlang.' });
        return;
      }

      const orderItems: OrderItemPayload[] = [];
      let subtotal = 0;

      for (const reqItem of body.items) {
        const menuItem = db.menu.find((m) => m.id === reqItem.menuItemId);
        if (!menuItem) {
          res.status(400).json({ error: 'Tanlangan taom menyuda topilmadi' });
          return;
        }
        if (!menuItem.available) {
          res.status(400).json({
            error: `"${menuItem.name}" hozircha tugagan. Iltimos, savatdan olib tashlang.`,
          });
          return;
        }
        const qty = Math.max(1, Math.min(50, Math.floor(Number(reqItem.quantity) || 1)));
        const addons: AddonOption[] = Array.isArray(reqItem.addons)
          ? reqItem.addons.map((a) => ({
              id: String(a.id || ''),
              name: String(a.name || ''),
              price: Math.max(0, Number(a.price) || 0),
            }))
          : [];
        const addonsSum = addons.reduce((acc, a) => acc + a.price, 0);
        const unitPrice = menuItem.price + addonsSum;
        const lineTotal = unitPrice * qty;

        subtotal += lineTotal;
        orderItems.push({
          menuItemId: menuItem.id,
          name: menuItem.name,
          unitPrice,
          quantity: qty,
          addons,
          lineTotal,
        });
      }

      const deliveryFee =
        deliveryType === 'pickup' || subtotal >= db.settings.freeDeliveryThreshold
          ? 0
          : db.settings.deliveryFee;
      const total = subtotal + deliveryFee;

      db.orderCounter += 1;
      const now = new Date().toISOString();
      const order: Order = {
        id: crypto.randomUUID(),
        orderNumber: `#OG-${db.orderCounter}`,
        createdAt: now,
        updatedAt: now,
        status: 'new',
        customerName,
        customerPhone,
        deliveryType,
        address: deliveryType === 'delivery' ? address : 'Oshxonadan olib ketish',
        paymentMethod,
        comment,
        items: orderItems,
        subtotal,
        deliveryFee,
        total,
        telegramSent: false,
      };

      // Send immediately in real time to Telegram channel
      const tgText = buildOrderTelegramMessage(order);
      const tgResult = await sendTelegramMessage(tgText);
      order.telegramSent = tgResult.ok;
      if (tgResult.messageId) {
        order.telegramMessageId = tgResult.messageId;
      }
      if (!tgResult.ok) {
        order.telegramError = tgResult.error;
      }

      db.orders.unshift(order);
      recordTelegramLog({
        type: 'order',
        orderNumber: order.orderNumber,
        success: tgResult.ok,
        messageId: tgResult.messageId,
        detail: tgResult.ok
          ? `Buyurtma ${order.orderNumber} kanalga yuborildi`
          : tgResult.error || 'Yuborishda xatolik',
      });
      saveDb();

      res.status(201).json({ order });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Buyurtmani saqlashda xatolik',
      });
    }
  });

  // Admin Login
  app.post('/api/admin/login', (req, res) => {
    const { pin } = req.body as { pin?: string };
    if (String(pin || '').trim() !== ADMIN_PIN) {
      res.status(401).json({ error: 'PIN kod noto‘g‘ri. Qaytadan urinib ko‘ring.' });
      return;
    }
    const token = crypto.randomBytes(24).toString('hex');
    adminTokens.add(token);
    res.json({ token });
  });

  app.post('/api/admin/logout', (req, res) => {
    const token = req.header('x-admin-token');
    if (token) adminTokens.delete(token);
    res.json({ ok: true });
  });

  // Admin: Orders
  app.get('/api/admin/orders', requireAdmin, (_req, res) => {
    res.json({ orders: db.orders });
  });

  app.patch('/api/admin/orders/:id/status', requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { status, notifyTelegram } = req.body as {
      status?: OrderStatus;
      notifyTelegram?: boolean;
    };

    if (!status || !VALID_STATUSES.includes(status)) {
      res.status(400).json({ error: 'Noto‘g‘ri buyurtma holati' });
      return;
    }

    const order = db.orders.find((o) => o.id === id);
    if (!order) {
      res.status(404).json({ error: 'Buyurtma topilmadi' });
      return;
    }

    order.status = status;
    order.updatedAt = new Date().toISOString();

    if (notifyTelegram !== false) {
      const statusMsg = [
        `🔄 <b>BUYURTMA HOLATI YANGILANDI</b>`,
        `🧾 <b>Raqam:</b> ${escapeHtml(order.orderNumber)}`,
        `👤 <b>Mijoz:</b> ${escapeHtml(order.customerName)} (${escapeHtml(order.customerPhone)})`,
        `📌 <b>Yangi holat:</b> <b>${STATUS_LABELS[status]}</b>`,
      ].join('\n');

      const tgRes = await sendTelegramMessage(statusMsg, order.telegramMessageId);
      recordTelegramLog({
        type: 'status',
        orderNumber: order.orderNumber,
        success: tgRes.ok,
        messageId: tgRes.messageId,
        detail: tgRes.ok
          ? `${order.orderNumber} → ${STATUS_LABELS[status]}`
          : tgRes.error || 'Holat yuborilmadi',
      });
    }

    saveDb();
    res.json({ order });
  });

  app.post('/api/admin/orders/:id/resend-telegram', requireAdmin, async (req, res) => {
    const order = db.orders.find((o) => o.id === req.params.id);
    if (!order) {
      res.status(404).json({ error: 'Buyurtma topilmadi' });
      return;
    }

    const tgResult = await sendTelegramMessage(buildOrderTelegramMessage(order));
    order.telegramSent = tgResult.ok;
    if (tgResult.messageId) order.telegramMessageId = tgResult.messageId;
    order.telegramError = tgResult.ok ? undefined : tgResult.error;

    recordTelegramLog({
      type: 'order',
      orderNumber: order.orderNumber,
      success: tgResult.ok,
      messageId: tgResult.messageId,
      detail: tgResult.ok
        ? `${order.orderNumber} qayta yuborildi`
        : tgResult.error || 'Qayta yuborishda xato',
    });
    saveDb();

    res.json({ order, telegramOk: tgResult.ok, error: tgResult.error });
  });

  app.delete('/api/admin/orders/:id', requireAdmin, (req, res) => {
    const idx = db.orders.findIndex((o) => o.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Buyurtma topilmadi' });
      return;
    }
    db.orders.splice(idx, 1);
    saveDb();
    res.json({ ok: true });
  });

  // Admin: Menu CRUD
  app.post('/api/admin/menu', requireAdmin, (req, res) => {
    const body = req.body as Partial<MenuItem>;
    const name = (body.name || '').trim();
    const category = body.category as MenuCategory;
    const price = Number(body.price);

    if (!name || name.length < 2) {
      res.status(400).json({ error: 'Taom nomini kiriting' });
      return;
    }
    if (!VALID_CATEGORIES.includes(category)) {
      res.status(400).json({ error: 'To‘g‘ri kategoriya tanlang' });
      return;
    }
    if (!Number.isFinite(price) || price < 1000) {
      res.status(400).json({ error: 'Narx kamida 1 000 so‘m bo‘lishi kerak' });
      return;
    }

    const newItem: MenuItem = {
      id: `item-${crypto.randomBytes(4).toString('hex')}`,
      name,
      category,
      description: (body.description || '').trim() || 'Olovda yangi tayyorlangan maxsus taom.',
      price: Math.round(price),
      weight: (body.weight || '300 g').trim(),
      image: (body.image || IMG_CLASSIC_BURGER).trim(),
      available: body.available !== false,
      popular: Boolean(body.popular),
      spicy: Boolean(body.spicy),
      prepMinutes: Math.max(2, Math.min(60, Math.round(Number(body.prepMinutes) || 12))),
    };

    db.menu.unshift(newItem);
    saveDb();
    res.status(201).json({ item: newItem, menu: db.menu });
  });

  app.put('/api/admin/menu/:id', requireAdmin, (req, res) => {
    const idx = db.menu.findIndex((m) => m.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Taom topilmadi' });
      return;
    }
    const existing = db.menu[idx];
    const body = req.body as Partial<MenuItem>;

    const updated: MenuItem = {
      ...existing,
      name: body.name !== undefined ? String(body.name).trim() || existing.name : existing.name,
      category:
        body.category && VALID_CATEGORIES.includes(body.category)
          ? body.category
          : existing.category,
      description:
        body.description !== undefined ? String(body.description).trim() : existing.description,
      price:
        body.price !== undefined && Number.isFinite(Number(body.price)) && Number(body.price) >= 1000
          ? Math.round(Number(body.price))
          : existing.price,
      weight: body.weight !== undefined ? String(body.weight).trim() : existing.weight,
      image: body.image !== undefined ? String(body.image).trim() || existing.image : existing.image,
      available: body.available !== undefined ? Boolean(body.available) : existing.available,
      popular: body.popular !== undefined ? Boolean(body.popular) : existing.popular,
      spicy: body.spicy !== undefined ? Boolean(body.spicy) : existing.spicy,
      prepMinutes:
        body.prepMinutes !== undefined && Number.isFinite(Number(body.prepMinutes))
          ? Math.max(2, Math.min(60, Math.round(Number(body.prepMinutes))))
          : existing.prepMinutes,
    };

    db.menu[idx] = updated;
    saveDb();
    res.json({ item: updated, menu: db.menu });
  });

  app.delete('/api/admin/menu/:id', requireAdmin, (req, res) => {
    const idx = db.menu.findIndex((m) => m.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Taom topilmadi' });
      return;
    }
    db.menu.splice(idx, 1);
    saveDb();
    res.json({ ok: true, menu: db.menu });
  });

  // Admin: Settings
  app.put('/api/admin/settings', requireAdmin, (req, res) => {
    const body = req.body as Partial<KitchenSettings>;
    db.settings = {
      kitchenOpen:
        body.kitchenOpen !== undefined ? Boolean(body.kitchenOpen) : db.settings.kitchenOpen,
      deliveryFee:
        body.deliveryFee !== undefined && Number.isFinite(Number(body.deliveryFee))
          ? Math.max(0, Math.round(Number(body.deliveryFee)))
          : db.settings.deliveryFee,
      freeDeliveryThreshold:
        body.freeDeliveryThreshold !== undefined &&
        Number.isFinite(Number(body.freeDeliveryThreshold))
          ? Math.max(0, Math.round(Number(body.freeDeliveryThreshold)))
          : db.settings.freeDeliveryThreshold,
      workHours:
        body.workHours !== undefined
          ? String(body.workHours).trim() || db.settings.workHours
          : db.settings.workHours,
      phone:
        body.phone !== undefined
          ? String(body.phone).trim() || db.settings.phone
          : db.settings.phone,
      address:
        body.address !== undefined
          ? String(body.address).trim() || db.settings.address
          : db.settings.address,
    };
    saveDb();
    res.json({ settings: db.settings });
  });

  // Admin: Telegram status & live test message
  app.get('/api/admin/telegram/status', requireAdmin, (_req, res) => {
    const totalSent = db.telegramLogs.filter((l) => l.success).length;
    const totalFailed = db.telegramLogs.filter((l) => !l.success).length;
    res.json({
      configured: Boolean(TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID),
      channelId: TELEGRAM_CHAT_ID,
      channelIdMasked:
        TELEGRAM_CHAT_ID.length > 6
          ? `${TELEGRAM_CHAT_ID.slice(0, 5)}•••${TELEGRAM_CHAT_ID.slice(-4)}`
          : TELEGRAM_CHAT_ID,
      totalSent,
      totalFailed,
      recentLogs: db.telegramLogs.slice(0, 20),
    });
  });

  app.post('/api/admin/telegram/test', requireAdmin, async (_req, res) => {
    const testText = [
      `✅ <b>OLOV GRILL — Telegram aloqa testi</b>`,
      `🕒 <b>Vaqt:</b> ${escapeHtml(formatTashkentTime(new Date().toISOString()))}`,
      `Barcha onlayn buyurtmalar ushbu kanalga real vaqt rejimida yuboriladi.`,
    ].join('\n');

    const result = await sendTelegramMessage(testText);
    recordTelegramLog({
      type: 'test',
      success: result.ok,
      messageId: result.messageId,
      detail: result.ok
        ? 'Test xabari kanalga muvaffaqiyatli yuborildi'
        : result.error || 'Test xabari yuborilmadi',
    });

    if (!result.ok) {
      res.status(502).json({ ok: false, error: result.error });
      return;
    }
    res.json({ ok: true, messageId: result.messageId });
  });

  // Serve Vite in dev, or built static dist in production
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Olov Grill server running on http://localhost:${PORT}`);
  });
}

startServer();
