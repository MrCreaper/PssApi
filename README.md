# Pixel StarShips API

PSSApi (Read above) is a (probably) broken javascript api for [Pixel StarShips](https://www.pixelstarships.com/)

## Heads up!
Most of thees commands dont work prob. This is not my highest priority as of writing but if you think it should be, let me know.

### History

From 
[Pixel StarShips](https://www.pixelstarships.com)
->
[PixyShip](https://github.com/JThinkable/pixyship)
->
[PixyShip (but Solevis)](https://github.com/solevis/pixyship/)
->
[This](https://github.com/MrCreaper/PssApi) [crap](https://www.npmjs.com/package/@mrcreaper/pssapi).

## Installation

Simple beginings, first lets download this [crap](https://www.npmjs.com/package/@mrcreaper/pssapii).
```bash
npm i @mrcreaper/pssapi
```

## Simple Example

```javascript
// Get the api
var pssAPI = require('@mrcreaper/pssapi');
// Create a new instance of the api.
var pss = new pssAPI.api();
// Wait until api is ready..
pss.on('ready', () => {
    // Get the current api settings
    console.log(pss.api_settings);
});
```
Result in console:
```yaml
Loading cache... ./pssApiCache.json
Cache loaded
PSS: Generated 1/1 devices

settingsModel {
  News: "Civilization is under threat, as the Crystal Plague descends upon the galaxy! Join your fleet and fight back, in Pixel Starships' first battle season!",
  NewsSpriteId: 12091,
  DailyRewardType: 'Starbux',
  DailyRewardArgument: '2',
  DailyItemRewards: [],
  SaleTitle: 'The Crystal Plague',
  SaleType: 'Item',
  SaleArgument: 1198,
  SaleItemMask: 28,
  SaleOnceOnly: true,
  SaleQuantity: 1,
  SaleStartDate: 2021-10-06T21:00:00.000Z,
  SaleEndDate: 2022-10-07T21:00:00.000Z,
  CommonCrew: {},
  HeroCrew: {},
  LimitedCatalogType: 'Item',
  LimitedCatalogArgument: 528,
  LimitedCatalogQuantity: 182,
  LimitedCatalogExpiryDate: 2022-10-07T21:00:00.000Z,
  LimitedCatalogCurrencyType: 'Starbux',
  LimitedCatalogCurrencyAmount: 800,
  LimitedCatalogMaxTotal: 100,
  LimitedCatalogRestockQuantity: 120,
  CargoItems: [],
  TournamentNews: 'During the last week of the each month, fleets compete for the most stars in the tournament finals. Top fleets are placed into divisions based on performance during the month, and battle other fleets of the same division to earn stars.',
  SettingId: '1',
  ServerSettingVersion: '1373627',
  MinimumClientVersion: '0.988.2',
  MaintenanceMessage: '',
  AllianceBadgeSpriteIds: [
    2261, 2262, 2263, 2264, 2265, 2266, 2267, 2268,
    2269, 2270, 2271, 2272, 2273, 2274, 2275, 2276,
    2277, 2278, 2279, 2280, 2281, 2282, 2283, 2284,
    2285, 2286, 2287, 2288, 2289, 2290, 2291, 2293,
    2294, 2295, 2296, 2297, 2298, 2299, 2300, 2301,
    2302, 2303, 2304, 2305, 2306, 2307, 2308, 2309,
    2310, 2311, 2312, 2313, 2314, 2315, 2316, 2317,
    2318, 2319, 2320, 2321, 2322,  653,  654,  655,
    2771
  ],
  FileVersion: 1916,
  SpriteVersion: 2627,
  CharacterDesignVersion: 981,
  CharacterPartVersion: 780,
  AnimationVersion: 625,
  RoomDesignVersion: 732,
  MissileDesignVersion: 464,
  ResearchDesignVersion: 465,
  RoomDesignSpriteVersion: 611,
  AchievementDesignVersion: 504,
  ConditionTypeVersion: 426,
  CraftDesignVersion: 397,
  ItemDesignVersion: 163197,
  ActionTypeVersion: 388,
  RoomDesignPurchaseVersion: 562,
  ShipDesignVersion: 582,
  LeagueVersion: 388,
  BackgroundVersion: 423,
  MissionDesignVersion: 654,
  TrainingDesignVersion: 369,
  FeatureMask: 3,
  ChallengeDesignVersion: 499,
  ProductionServer: 'api2.pixelstarships.com',
  Flags: 9817,
  CharacterDesignActionVersion: 324,
  RewardDesignVersion: 237378,
  TournamentFinalDuration: 7,
  DivisionDesignVersion: 434,
  CollectionDesignVersion: 323,
  RewardPointPercentage: '140',
  IsDebug: false,
  DrawDesignVersion: 281,
  AbilityDesignVersion: 275,
  VipDesignVersion: 275,
  StarSystemVersion: 283,
  StarSystemLinkVersion: 279,
  PlanetVersion: 259,
  MaxDailyDraws: 12,
  CurrentAndroidVersion: '0.988.2',
  PromotionDesignVersion: 414,
  RewardVideoTimeReduction: 900,
  ABTestingRollout: 0,
  LootModifiers: [ 0, 10, 20, 50 ],
  TournamentBonusScore: 6,
  SituationDesignVersion: 355,
  AFeatureMask: 0,
  BFeatureMask: 1,
  PrestigeTopCharacterDesignId: 452,
  ProBonoLimit: 10,
  TaskDesignVersion: 234622,
  NewsDesignVersion: 270,
  MinimumVersion: 0.988,
  RecommendedVersion: 0.988,
  GracePeriod: 0,
  BoostMultiplier: 2,
  BoostDuration: +014399-12-31T22:00:00.000Z,
  MaxBoostDuration: +043199-12-31T22:00:00.000Z,
  ChecksumType: 'HardcodedChecksum',
  ItemDesignActionVersion: 21,
  ABTestingStartDate: 2019-03-03T22:00:00.000Z,
  SupportTaskRanDate: 2022-01-30T20:12:07.000Z,
  TournamentSpriteId: 8000,
  NewUserCount: 2675,
  NewsUpdateDate: 2022-01-29T22:01:27.000Z,
  ReplayAvailableDate: 2021-09-09T18:00:49.000Z,
  BackgroundId: 34,
  BattleBackgroundId: 0,
  getTime: 2022-01-30T22:13:15.024Z
}
```

btw you might have noticed that the news is outdated in here. Thats becouse for some reason you still get it with the api settings with news from the last season, to update it just run `get_live_ops` on the returned settingsModel.

```javascript
pss.get_live_ops(pss); // All method that get data also need to get an api somehow. shhh..
console.log(pss.api_settings);
```

## Cache

Also you should notice a file called pssApiCache.json pop up.
I dont really want to DDOS pixel starships servers so i hope that you wont too..
In there we keep "devices" which is just a way to get some sweet sweet user data and other stuff. 
Also theres the api settings, so we would know when to update rooms and such.

You can of course change the path where its made
```javascript
var pssAPI = require('pssapi');
var pss = new pssAPI.api();
pss.cachePath = `./caches/pss.json`; // just make sure the folder exists!
```

## test.js

If you so wish, you can also use the `test.js` ive included for testing (myself).
Its not that user friendly but the code is simple enough to dig in yourself and find out the commands.

Notably:
`downsprites` downloads **ALL** the sprites from PSS.
If you are too lazy or just dont want to waste that storage of yours (~250mb). Ive, again come to the rescue!
You can just get the sprites from 
[https://mrtoucan.dev/assets/pss/[sprite id | sprite key | file id (add .png or .jpg)]](https://mrtoucan.dev/assets/pss/460) <img href="https://mrtoucan.dev/assets/pss/460">