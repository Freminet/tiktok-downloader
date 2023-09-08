const axios = require('axios');
const port = process.env.PORT || 3000;
const host = ("RENDER" in process.env) ? `0.0.0.0` : `localhost`;

const fastify = require('fastify')({
  logger: true
})

let html = `
<!doctype html>
<html>
<head> 
    <title>furina</title>
	<meta charset="utf-8">
	<meta name="theme-color" content="#FFF">
	<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
	<link href="https://fonts.googleapis.com/css2?family=Bellota+Text:wght@400;700&family=Noto+Serif+JP:wght@400;500;700&display=swap" rel="stylesheet">
	<script src="https://furina.nl/assets/css/common.js"></script>
	<script src="https://furina.nl/assets/css/top.js"></script>
	<script src="https://code.jquery.com/jquery-3.6.0.min.js" defer></script>
</head>
<body id="top" class="body js-chengeCont">
	<style>
	    a {
	        color: white;
	        border: none;
	        cursor: pointer;
	        text-decoration: none;
	        display: inline-block;
	    }
	    img {
	        width: 100%;
	        height: auto;
	        object-fit: contain;
	    }
	
	    .discord,
	    .headerNavLists__text {
	        font-size: 1.2rem;
	    }
	
	    @media screen and (max-width: 768px) {
	        .discord,
	        .headerNavLists__text {
	            font-size: 1rem;
	        }
	    }
	
	    form {
	        text-align: center;
	    }
	
	    label {
	        display: block;
	        font-size: 18px;
	        margin-bottom: 10px;
	    }
	
	    input {
	        padding: 8px;
	        font-size: 16px;
	        border: none;
	        border-radius: 4px;
	        width: 100%;
	        margin-bottom: 20px;
	    }
	
	    .draggable-button {
	        background-color: #407AF7;
	        color: #ffffff;
	        border: none;
	        border-radius: 4px;
	        padding: 10px 20px;
	        font-size: 18px;
	        cursor: pointer;
	        display: inline-block;
	    }
	
	    .draggable-button:hover {
	        cursor: pointer;
	        background-color: rgba(57, 124, 247, 0.616);
	    }
	    
	    .draggable-button:active {
	        cursor: pointer;
	    }
	
	    @keyframes spin {
	        0% { transform: translate(-50%, -50%) rotate(0deg); }
	        100% { transform: translate(-50%, -50%) rotate(360deg); }
	    }
	</style>
	<div id="containera">
		<div class="js-fvImg">
			<img src="https://i.imgur.com/dkowirF.png" alt="">
        <br><span class="headerNavLists__text font-bellota">Drag the "Download" button to your bookmarks bar</span><br>
        <a href="javascript:(function(){window.location.href='https://hoyoverse.onrender.com/tiktok?url='+encodeURIComponent(window.location.href);})()" draggable="true" class="draggable-button">Download</a>
		</div>
	</div>
	<div class="fullBg js-fixed"></div>
	<script src="https://furina.nl/assets/js/jquery.common.js"></script>
</body>
</html>
`

fastify.get('/', function (request, reply) {
  reply.type('text/html').send(html)
})

fastify.get('/tiktok', async (request, reply) => {
  const videoUrl = request.query.url;
  const apiUrl = 'https://api21-h2.tiktokv.com/aweme/v1/feed/?aweme_id=';

  try {
    const videoId = getVideoIdFromUrl(videoUrl);

    if (!videoId) {
      reply.status(400).send({ error: 'Invalid TikTok URL' });
      return;
    }

    const requestUrl = `${apiUrl}${videoId}`;

    const response = await axios.get(requestUrl);

    if (response.data.aweme_list[0].video.play_addr) {
      const videoLink = response.data.aweme_list[0].video.play_addr.url_list[0];
      const videoData = await downloadVideo(videoLink);

      if (!videoData) {
        reply.status(500).send({ error: 'Failed to download the video' });
        return;
      }

      reply.header('Content-Type', 'application/octet-stream');
      reply.header('Content-Disposition', 'attachment; filename="downloaded_video.mp4"');
      reply.send(videoData);
    } else {
      reply.status(404).send({ error: 'Video data not available' });
    }
  } catch (error) {
    console.error(error);
    reply.status(500).send({ error: 'Internal server error' });
  }
});

function getVideoIdFromUrl(url) {
  const parts = new URL(url);
  const pathParts = parts.pathname.split('/').filter(part => part !== '');
  const videoId = pathParts[pathParts.length - 1].replace(/\D/g, '');

  return videoId;
}

async function downloadVideo(videoUrl) {
  try {
    const response = await axios.get(videoUrl, { responseType: 'arraybuffer' });
    return response.data;
  } catch (error) {
    console.error(error);
    return null;
  }
}

fastify.listen({host: host, port: port }, function (err, address) {
  if (err) {
    fastify.log.error(err)
    process.exit(1)
  }
})
