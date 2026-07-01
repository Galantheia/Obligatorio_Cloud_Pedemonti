import 'dotenv/config';

import express from 'express';
import cookieParser from 'cookie-parser';
import crypto from 'crypto';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';

const app = express();
const PORT = Number(process.env.PORT || 3000);
const SESSION_COOKIE_NAME = 'admin_session';
const SESSION_DURATION_MS = 1000 * 60 * 60 * 8;
const SESSION_SECRET = process.env.SESSION_SECRET || 'change-this-session-secret';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cookieParser());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const productGroups = (process.env.PRODUCT_GROUPS || 'gadgets,home_office,smart_home')
  .split(',')
  .map((group) => group.trim())
  .filter(Boolean);

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined
});

function getRandomGroup() {
  return productGroups[Math.floor(Math.random() * productGroups.length)] || 'gadgets';
}

function getSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: SESSION_DURATION_MS
  };
}

function hexColorFromText(text) {
  let hash = 0;

  for (let i = 0; i < text.length; i += 1) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }

  let color = '#';

  for (let i = 0; i < 3; i += 1) {
    const value = (hash >> (i * 8)) & 0xff;
    color += value.toString(16).padStart(2, '0');
  }

  return color.toUpperCase();
}

async function getEc2Metadata(metadataPath) {
  try {
    const tokenController = new AbortController();
    const tokenTimeout = setTimeout(() => tokenController.abort(), 1000);

    const tokenResponse = await fetch('http://169.254.169.254/latest/api/token', {
      method: 'PUT',
      headers: {
        'X-aws-ec2-metadata-token-ttl-seconds': '21600'
      },
      signal: tokenController.signal
    });

    clearTimeout(tokenTimeout);

    if (!tokenResponse.ok) {
      return null;
    }

    const token = await tokenResponse.text();

    const metadataController = new AbortController();
    const metadataTimeout = setTimeout(() => metadataController.abort(), 1000);

    const metadataResponse = await fetch(
      `http://169.254.169.254/latest/meta-data/${metadataPath}`,
      {
        headers: {
          'X-aws-ec2-metadata-token': token
        },
        signal: metadataController.signal
      }
    );

    clearTimeout(metadataTimeout);

    if (!metadataResponse.ok) {
      return null;
    }

    return await metadataResponse.text();
  } catch {
    return null;
  }
}

async function getCurrentInstanceInfo() {
  const instanceId = await getEc2Metadata('instance-id');
  const availabilityZone = await getEc2Metadata('placement/availability-zone');
  const instanceType = await getEc2Metadata('instance-type');

  const serverId = instanceId || process.env.LOCAL_INSTANCE_ID || os.hostname();
  const color = hexColorFromText(serverId);

  return {
    serverId,
    instanceId,
    hostname: os.hostname(),
    availabilityZone,
    instanceType,
    color,
    message: `Respuesta generada por ${serverId}`
  };
}

function validateDatabaseConfig() {
  const requiredVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];

  return requiredVars.filter((varName) => !process.env[varName]);
}

function normalizeText(value) {
  return String(value || '').trim();
}

function normalizeCategory(value) {
  return normalizeText(value).toLowerCase().replace(/\s+/g, '_');
}

function parseProductPayload(body) {
  const productGroup = normalizeCategory(body?.productGroup);
  const name = normalizeText(body?.name);
  const imageUrl = normalizeText(body?.imageUrl);
  const description = normalizeText(body?.description);
  const price = Number(body?.price);
  const displayOrder = Number(body?.displayOrder || 0);
  const active = body?.active !== false;

  if (!productGroup) {
    return { error: 'Ingresa una categoria para el producto.' };
  }

  if (!name) {
    return { error: 'Ingresa un nombre para el producto.' };
  }

  if (!description) {
    return { error: 'Ingresa una descripcion para el producto.' };
  }

  if (!Number.isFinite(price) || price < 0) {
    return { error: 'Ingresa un precio valido.' };
  }

  if (!Number.isInteger(displayOrder) || displayOrder < 0) {
    return { error: 'El orden de visualizacion debe ser un entero positivo.' };
  }

  return {
    productGroup,
    name,
    price,
    imageUrl: imageUrl || null,
    description,
    displayOrder,
    active
  };
}

function parseProductId(value) {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  return id;
}

function parseStoredPasswordHash(value) {
  const [algorithm, salt, hash] = String(value || '').split('$');

  if (algorithm !== 'scrypt' || !salt || !hash) {
    return null;
  }

  return { salt, hash };
}

function verifyPassword(password, storedHash) {
  const parsed = parseStoredPasswordHash(storedHash);

  if (!parsed) {
    return false;
  }

  const derivedKey = crypto.scryptSync(password, parsed.salt, 64);
  const storedKey = Buffer.from(parsed.hash, 'hex');

  if (derivedKey.length !== storedKey.length) {
    return false;
  }

  return crypto.timingSafeEqual(derivedKey, storedKey);
}

function signSessionValue(value) {
  return crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(value)
    .digest('base64url');
}

function createSessionToken(user) {
  const payload = {
    userId: user.id,
    role: user.role,
    expiresAt: Date.now() + SESSION_DURATION_MS
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = signSessionValue(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

function readSessionToken(token) {
  if (!token || !token.includes('.')) {
    return null;
  }

  const [encodedPayload, signature] = token.split('.');
  const expectedSignature = signSessionValue(encodedPayload);

  if (!signature || signature.length !== expectedSignature.length) {
    return null;
  }

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));

    if (!payload?.userId || payload?.expiresAt < Date.now()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

function sanitizeUser(user) {
  return {
    id: user.id,
    username: user.username,
    fullName: user.full_name,
    role: user.role,
    createdAt: user.created_at
  };
}

async function getUserByUsername(username) {
  const [rows] = await pool.query(
    `
    SELECT id, username, full_name, role, password_hash, active, created_at
    FROM users
    WHERE username = ?
    LIMIT 1
    `,
    [username]
  );

  return rows[0] || null;
}

async function getUserById(id) {
  const [rows] = await pool.query(
    `
    SELECT id, username, full_name, role, password_hash, active, created_at
    FROM users
    WHERE id = ?
    LIMIT 1
    `,
    [id]
  );

  return rows[0] || null;
}

async function getProductById(id) {
  const [rows] = await pool.query(
    `
    SELECT id, product_group, name, price, image_url, description, display_order, active
    FROM products
    WHERE id = ?
    LIMIT 1
    `,
    [id]
  );

  return rows[0] || null;
}

async function getAuthenticatedAdmin(req) {
  const token = req.cookies?.[SESSION_COOKIE_NAME];
  const payload = readSessionToken(token);

  if (!payload) {
    return null;
  }

  const user = await getUserById(payload.userId);

  if (!user || !user.active || user.role !== 'admin') {
    return null;
  }

  return user;
}

async function requireAdminAuth(req, res, next) {
  try {
    const user = await getAuthenticatedAdmin(req);

    if (!user) {
      return res.status(401).json({
        error: 'No autorizado.'
      });
    }

    req.adminUser = user;
    next();
  } catch (error) {
    next(error);
  }
}

app.get('/health', (req, res) => {
  res.status(200).json({ ok: true });
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/api/server-info', async (req, res) => {
  const info = await getCurrentInstanceInfo();
  res.json(info);
});

app.get('/api/products', async (req, res) => {
  try {
    const missingVars = validateDatabaseConfig();

    if (missingVars.length > 0) {
      return res.status(500).json({
        error: `Faltan variables de base de datos: ${missingVars.join(', ')}. Revisa tu archivo .env.`
      });
    }

    let productGroup = req.cookies?.product_group;

    if (!productGroup || !productGroups.includes(productGroup)) {
      productGroup = getRandomGroup();

      res.cookie('product_group', productGroup, {
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60 * 24 * 30
      });
    }

    const search = normalizeText(req.query.search);
    let query = `
      SELECT id, product_group, name, price, image_url, description, display_order
      FROM products
      WHERE active = TRUE
    `;
    let values = [];

    if (search) {
      values = [`%${search}%`];
      query += `
        AND (
          name LIKE ?
          OR description LIKE ?
        )
      `;
      values.push(`%${search}%`);
    } else {
      values = [productGroup];
      query += `
        AND product_group = ?
      `;
    }

    query += search
      ? `
          ORDER BY display_order ASC, id ASC
          LIMIT 24
        `
      : `
          ORDER BY display_order ASC, id ASC
          LIMIT 6
        `;

    const [rows] = await pool.query(query, values);

    res.json({
      productGroup,
      search,
      products: rows
    });
  } catch (error) {
    console.error('Error consultando productos:', error);

    res.status(500).json({
      error: 'Error al obtener productos desde MySQL.'
    });
  }
});

app.post('/api/product-group/reset', (req, res) => {
  res.clearCookie('product_group');
  res.json({ ok: true, message: 'Grupo de productos reiniciado.' });
});

app.post('/api/admin/login', async (req, res) => {
  try {
    const missingVars = validateDatabaseConfig();

    if (missingVars.length > 0) {
      return res.status(500).json({
        error: `Faltan variables de base de datos: ${missingVars.join(', ')}. Revisa tu archivo .env.`
      });
    }

    const username = normalizeText(req.body?.username).toLowerCase();
    const password = String(req.body?.password || '');

    if (!username || !password) {
      return res.status(400).json({
        error: 'Ingresa usuario y contrasena.'
      });
    }

    const user = await getUserByUsername(username);

    if (!user || !user.active || user.role !== 'admin' || !verifyPassword(password, user.password_hash)) {
      return res.status(401).json({
        error: 'Credenciales invalidas.'
      });
    }

    res.cookie(SESSION_COOKIE_NAME, createSessionToken(user), getSessionCookieOptions());

    res.json({
      ok: true,
      user: sanitizeUser(user)
    });
  } catch (error) {
    console.error('Error iniciando sesion admin:', error);

    res.status(500).json({
      error: 'No se pudo iniciar sesion.'
    });
  }
});

app.post('/api/admin/logout', (req, res) => {
  res.clearCookie(SESSION_COOKIE_NAME, getSessionCookieOptions());
  res.json({ ok: true });
});

app.get('/api/admin/session', requireAdminAuth, async (req, res) => {
  res.json({
    authenticated: true,
    user: sanitizeUser(req.adminUser)
  });
});

app.get('/api/admin/overview', requireAdminAuth, async (req, res) => {
  try {
    const [[productStatsRows], [groupStatsRows], [userStatsRows], serverInfo] = await Promise.all([
      pool.query(
        `
        SELECT
          COUNT(*) AS total_products,
          SUM(CASE WHEN active = TRUE THEN 1 ELSE 0 END) AS active_products
        FROM products
        `
      ),
      pool.query(
        `
        SELECT product_group, COUNT(*) AS total
        FROM products
        WHERE active = TRUE
        GROUP BY product_group
        ORDER BY product_group ASC
        `
      ),
      pool.query(
        `
        SELECT
          COUNT(*) AS total_users,
          SUM(CASE WHEN role = 'admin' AND active = TRUE THEN 1 ELSE 0 END) AS active_admins
        FROM users
        `
      ),
      getCurrentInstanceInfo()
    ]);

    res.json({
      user: sanitizeUser(req.adminUser),
      stats: {
        products: productStatsRows[0],
        users: userStatsRows[0],
        groups: groupStatsRows
      },
      server: serverInfo
    });
  } catch (error) {
    console.error('Error cargando panel admin:', error);

    res.status(500).json({
      error: 'No se pudo cargar el panel admin.'
    });
  }
});

app.get('/api/admin/products', requireAdminAuth, async (req, res) => {
  try {
    const search = normalizeText(req.query.search);
    let query = `
      SELECT id, product_group, name, price, image_url, description, display_order, active
      FROM products
    `;
    let values = [];

    if (search) {
      query += `
        WHERE
          product_group LIKE ?
          OR name LIKE ?
          OR description LIKE ?
      `;
      values = [`%${search}%`, `%${search}%`, `%${search}%`];
    }

    query += `
      ORDER BY product_group ASC, display_order ASC, id ASC
    `;

    const [rows] = await pool.query(query, values);

    res.json({
      search,
      products: rows
    });
  } catch (error) {
    console.error('Error listando productos admin:', error);

    res.status(500).json({
      error: 'No se pudo listar los productos.'
    });
  }
});

app.post('/api/admin/products', requireAdminAuth, async (req, res) => {
  try {
    const payload = parseProductPayload(req.body);

    if (payload.error) {
      return res.status(400).json({
        error: payload.error
      });
    }

    const [result] = await pool.query(
      `
      INSERT INTO products (
        product_group,
        name,
        price,
        image_url,
        description,
        display_order,
        active
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        payload.productGroup,
        payload.name,
        payload.price,
        payload.imageUrl,
        payload.description,
        payload.displayOrder,
        payload.active
      ]
    );

    const product = await getProductById(result.insertId);

    res.status(201).json({
      ok: true,
      product
    });
  } catch (error) {
    console.error('Error creando producto admin:', error);

    res.status(500).json({
      error: 'No se pudo crear el producto.'
    });
  }
});

app.put('/api/admin/products/:id', requireAdminAuth, async (req, res) => {
  try {
    const productId = parseProductId(req.params.id);

    if (!productId) {
      return res.status(400).json({
        error: 'ID de producto invalido.'
      });
    }

    const payload = parseProductPayload(req.body);

    if (payload.error) {
      return res.status(400).json({
        error: payload.error
      });
    }

    const [result] = await pool.query(
      `
      UPDATE products
      SET
        product_group = ?,
        name = ?,
        price = ?,
        image_url = ?,
        description = ?,
        display_order = ?,
        active = ?
      WHERE id = ?
      `,
      [
        payload.productGroup,
        payload.name,
        payload.price,
        payload.imageUrl,
        payload.description,
        payload.displayOrder,
        payload.active,
        productId
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: 'Producto no encontrado.'
      });
    }

    const product = await getProductById(productId);

    res.json({
      ok: true,
      product
    });
  } catch (error) {
    console.error('Error actualizando producto admin:', error);

    res.status(500).json({
      error: 'No se pudo actualizar el producto.'
    });
  }
});

app.delete('/api/admin/products/:id', requireAdminAuth, async (req, res) => {
  try {
    const productId = parseProductId(req.params.id);

    if (!productId) {
      return res.status(400).json({
        error: 'ID de producto invalido.'
      });
    }

    const [result] = await pool.query(
      `
      DELETE FROM products
      WHERE id = ?
      `,
      [productId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: 'Producto no encontrado.'
      });
    }

    res.json({
      ok: true
    });
  } catch (error) {
    console.error('Error eliminando producto admin:', error);

    res.status(500).json({
      error: 'No se pudo eliminar el producto.'
    });
  }
});

app.listen(PORT, () => {
  console.log(`Demo ALB + MySQL corriendo en http://localhost:${PORT}`);
});
