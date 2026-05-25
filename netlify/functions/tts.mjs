// Netlify Serverless Function: TTS Proxy
// Proxies text-to-speech requests server-side, bypassing CORS restrictions on mobile browsers.
// Endpoint: /.netlify/functions/tts?text=hello
//
// Tries Google Translate TTS first (high quality neural voices),
// with clean error handling and proper audio Content-Type headers.

export default async (request) => {
  const url = new URL(request.url);
  const text = url.searchParams.get('text');

  if (!text || text.trim().length === 0) {
    return new Response(JSON.stringify({ error: 'Missing "text" query parameter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const cleanText = text.trim().toLowerCase();
  const encodedText = encodeURIComponent(cleanText);

  // Strategy 1: Google Translate TTS (high quality neural voices)
  const googleTtsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=en&client=tw-ob&q=${encodedText}`;

  try {
    const response = await fetch(googleTtsUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        'Referer': 'https://translate.google.com/',
      },
    });

    if (!response.ok) {
      throw new Error(`Google TTS responded with status ${response.status}`);
    }

    const audioBuffer = await response.arrayBuffer();

    return new Response(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (googleErr) {
    console.error('Google TTS proxy failed:', googleErr.message);
  }

  // Strategy 2: Youdao Dictionary TTS (fallback, also high quality)
  const youdaoTtsUrl = `https://dict.youdao.com/dictvoice?type=2&audio=${encodedText}`;

  try {
    const response = await fetch(youdaoTtsUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`Youdao TTS responded with status ${response.status}`);
    }

    const audioBuffer = await response.arrayBuffer();

    return new Response(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (youdaoErr) {
    console.error('Youdao TTS proxy failed:', youdaoErr.message);
  }

  return new Response(JSON.stringify({ error: 'All TTS providers failed' }), {
    status: 502,
    headers: { 'Content-Type': 'application/json' },
  });
};
