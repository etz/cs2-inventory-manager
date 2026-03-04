/**
 * Fetches latest CS2 items_game and csgo_english from GameTracking-CS2
 * and writes them to the backup JSON files used when remote fetch fails.
 * Run from project root: node scripts/update-cs2-backup.js
 */

const axios = require('axios');
const VDF = require('@node-steam/vdf');
const fs = require('fs');
const path = require('path');

const ITEMS_URL =
  'https://raw.githubusercontent.com/SteamDatabase/GameTracking-CS2/master/game/csgo/pak01_dir/scripts/items/items_game.txt';
const TRANSLATIONS_URL =
  'https://raw.githubusercontent.com/SteamDatabase/GameTracking-CS2/master/game/csgo/pak01_dir/resource/csgo_english.txt';

const BACKUP_DIR = path.join(
  __dirname,
  '..',
  'src',
  'main',
  'helpers',
  'classes',
  'steam',
  'items',
  'itemsBackupFiles'
);

function updateItemsLoop(jsonData, keyToRun) {
  const returnDict = {};
  for (const [key, value] of Object.entries(jsonData['items_game'] || {})) {
    if (key === keyToRun) {
      for (const [subKey, subValue] of Object.entries(value || {})) {
        returnDict[subKey] = subValue;
      }
    }
  }
  return returnDict;
}

function parseItemsGame(data) {
  const dict_to_write = {
    items: {},
    paint_kits: {},
    prefabs: {},
    sticker_kits: {},
    casket_icons: {},
  };
  const jsonData = VDF.parse(data || '');
  dict_to_write['items'] = updateItemsLoop(jsonData, 'items');
  dict_to_write['paint_kits'] = updateItemsLoop(jsonData, 'paint_kits');
  dict_to_write['prefabs'] = updateItemsLoop(jsonData, 'prefabs');
  dict_to_write['sticker_kits'] = updateItemsLoop(jsonData, 'sticker_kits');
  dict_to_write['music_kits'] = updateItemsLoop(
    jsonData,
    'music_definitions'
  );
  dict_to_write['graffiti_tints'] = updateItemsLoop(
    jsonData,
    'graffiti_tints'
  );
  const altIcons = updateItemsLoop(jsonData, 'alternate_icons2');
  dict_to_write['casket_icons'] =
    altIcons && typeof altIcons['casket_icons'] === 'object'
      ? altIcons['casket_icons']
      : {};
  return dict_to_write;
}

function parseTranslations(data) {
  const finalDict = {};
  const ks = (data || '').split(/\n/);
  ks.forEach(function (value) {
    const test = value.match(/"(.*?)"/g);
    if (test && test[1]) {
      finalDict[test[0].replaceAll('"', '').toLowerCase()] = test[1];
    }
  });
  return finalDict;
}

async function main() {
  if (!fs.existsSync(BACKUP_DIR)) {
    console.error('Backup directory not found:', BACKUP_DIR);
    process.exit(1);
  }

  console.log('Fetching CS2 items_game.txt...');
  const itemsRes = await axios.get(ITEMS_URL);
  const itemsData = parseItemsGame(itemsRes.data);
  const itemsPath = path.join(BACKUP_DIR, 'items_game.json');
  fs.writeFileSync(itemsPath, JSON.stringify(itemsData, null, 2), 'utf8');
  console.log('Wrote', itemsPath);

  console.log('Fetching CS2 csgo_english.txt...');
  const transRes = await axios.get(TRANSLATIONS_URL);
  const transData = parseTranslations(transRes.data);
  const transPath = path.join(BACKUP_DIR, 'csgo_english.json');
  fs.writeFileSync(transPath, JSON.stringify(transData, null, 2), 'utf8');
  console.log('Wrote', transPath);

  console.log('Backup files updated to latest CS2 data.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
