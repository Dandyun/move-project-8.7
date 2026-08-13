MOVE — Visual Archive of Movement and Emotion / v3

FILES
  index.html
  style.css
  script.js
  photos.csv
  photos-data.js
  images/

IMPORTANT
Put the actual photograph files inside images/ with filenames matching the
Filename column exactly (for example P0001.JPG).

RUN
The project includes photos-data.js as a fallback, so it can display data when
index.html is opened directly. For the most reliable behavior, run a local server:

  python3 -m http.server 8000

Then visit http://localhost:8000

NEW IN THIS VERSION
1. Emotion by Filters
   - eight fixed Plutchik emotion categories
   - irregular poster-like bubble layout
   - circle size = filtered photograph count
   - matching horizontal bar chart
   - x-axis automatically changes with the current maximum count
   - clicking an emotion opens its filtered gallery

2. Hierarchical filters
   - Country constrains City
   - every dropdown is recalculated from the other active filters so impossible
     combinations are removed

3. Comparing Emotion
   - choose a dimension and value, then Add filter
   - multiple radar polygons overlap for comparison
   - radar uses percentages to make different sample sizes comparable

4. Emotional Movement
   - current filters and selected emotion are applied
   - click any point to show a large photograph and full metadata below

5. Physical Movement Map
   - horizontally scrollable country → city hierarchy
   - country order follows first photographic appearance in the archive
   - circle size = photograph count
   - hover converts a location circle into an 8-emotion pie chart
