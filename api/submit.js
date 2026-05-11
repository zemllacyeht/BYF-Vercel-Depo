export default async function handler(req, res) {
  // Allow CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });

  try {
    const payload = req.body;

    const notionBody = {
      parent: { type: 'database_id', database_id: '4bc42faa-9495-4967-b898-eb6c27ce349a' },
      properties: {
        'Client Name': {
          title: [{ text: { content: payload.clientName || '' } }]
        },
        'Business Name': {
          rich_text: [{ text: { content: payload.businessName || '' } }]
        },
        ...(payload.industry && {
          'Industry': { select: { name: payload.industry } }
        }),
        ...(payload.currentWebsite && {
          'Current Website': { url: payload.currentWebsite }
        }),
        ...(payload.services?.length && {
          'Service Need': { multi_select: payload.services.map(s => ({ name: s })) }
        }),
        ...(payload.notes && {
          'Notes': { rich_text: [{ text: { content: payload.notes } }] }
        }),
        ...(payload.email && {
          'Primary Contact Email': { email: payload.email }
        }),
        ...(payload.phone && {
          'Primary Contact Phone': { phone_number: payload.phone }
        }),
        ...(payload.referral && {
          'Referral Source': { select: { name: payload.referral } }
        }),
        'Project Status': { select: { name: 'Lead' } }
      }
    };

    const notionRes = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NOTION_TOKEN}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2025-09-03'
      },
      body: JSON.stringify(notionBody)
    });

    if (!notionRes.ok) {
      const err = await notionRes.text();
      console.error('Notion API error:', err);
      return res.status(500).json({ ok: false, error: err });
    }

    return res.status(200).json({ ok: true });

  } catch (err) {
    console.error('Handler error:', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
