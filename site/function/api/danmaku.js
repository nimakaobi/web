// GET 请求：拉取最新弹幕
export async function onRequestGet(context) {
  const DB = context.env.DB;
  const { request } = context;
  const url = new URL(request.url);
  const since = url.searchParams.get('since') || '';

  let query = 'SELECT content, created_at FROM danmaku ';
  const params = [];

  if (since) {
    query += 'WHERE created_at > ? ';
    params.push(since);
  }
  query += 'ORDER BY created_at DESC LIMIT 20';

  const { results } = await DB.prepare(query).bind(...params).all();

  return new Response(JSON.stringify(results), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store'
    }
  });
}

// POST 请求：提交弹幕
export async function onRequestPost(context) {
  const DB = context.env.DB;
  const { request } = context;

  try {
    const body = await request.json().catch(() => ({}));
    const content = body.content?.trim();

    if (!content || content.length > 15) {
      return new Response(JSON.stringify({ error: '内容长度需在1-15字之间' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    await DB.prepare('INSERT INTO danmaku (content) VALUES (?)')
      .bind(content)
      .run();

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: '提交失败' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}