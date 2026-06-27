import 'dotenv/config';

import express from 'express';
import cookieParser from 'cookie-parser';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';

const app = express();
const PORT = Number(process.env.PORT || 3000);

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

  // Si tu RDS MySQL requiere SSL, podés activar esto desde .env
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined
});

function getRandomGroup() {
  return productGroups[Math.floor(Math.random() * productGroups.length)] || 'gadgets';
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

  const missingVars = requiredVars.filter((varName) => !process.env[varName]);

  return missingVars;
}

app.get('/health', (req, res) => {
  res.status(200).json({ ok: true });
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
        error: `Faltan variables de base de datos: ${missingVars.join(', ')}. Revisá tu archivo .env.`
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

    const [rows] = await pool.query(
      `
      SELECT id, product_group, name, price, image_url, description, display_order
      FROM products
      WHERE product_group = ?
        AND active = TRUE
      ORDER BY display_order ASC, id ASC
      LIMIT 6
      `,
      [productGroup]
    );

    res.json({
      productGroup,
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

app.listen(PORT, () => {
  console.log(`Demo ALB + MySQL corriendo en http://localhost:${PORT}`);
});