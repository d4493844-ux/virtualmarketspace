/*
  # Fix dead Google video URLs in existing video records
  
  The commondatastorage.googleapis.com URLs return 403 Forbidden.
  Replace with working storage.googleapis.com equivalents.
*/

UPDATE videos SET video_url = 'https://storage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4'
  WHERE video_url LIKE '%ForBiggerBlazes%';

UPDATE videos SET video_url = 'https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4'
  WHERE video_url LIKE '%ForBiggerEscapes%';

UPDATE videos SET video_url = 'https://storage.googleapis.com/gtv-videos-bucket/sample/VolkswagenGTIReview.mp4'
  WHERE video_url LIKE '%ForBiggerFun%';

UPDATE videos SET video_url = 'https://storage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4'
  WHERE video_url LIKE '%ForBiggerJoyrides%';

UPDATE videos SET video_url = 'https://storage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4'
  WHERE video_url LIKE '%ForBiggerMeltdowns%';

UPDATE videos SET video_url = 'https://storage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4'
  WHERE video_url LIKE '%ElephantsDream%';

UPDATE videos SET video_url = 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
  WHERE video_url LIKE '%BigBuckBunny%' AND video_url LIKE '%commondatastorage%';

