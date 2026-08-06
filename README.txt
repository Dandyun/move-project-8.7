MOVE — Filtered Emotion Website v2

STRUCTURE
1. Landing / project description
2. Eight fixed emotion circles + filters
3. Gallery for selected emotion
4. Filtered emotional movement timeline
5. Large photograph detail panel

HOW TO SHOW PHOTOS
Place the actual JPG/JPEG files in the images folder using the exact filenames
listed in photos.csv, for example:

images/P0001.JPG
images/P0002.JPG
images/P0003.jpg

The previous version did not show photographs because the generated images
folder was empty. This version displays a clear missing-file message instead
of silently failing.

DATA RULES
- Circle size = number of photos for each emotion under active filters
- Selecting an emotion filters both gallery and timeline
- Timeline point click opens the large photograph detail section
- Rows without both Emotion and Value are excluded from emotional charts
