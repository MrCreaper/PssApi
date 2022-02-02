const bent = require('bent');
const getBuffer = bent('buffer');
const ev = require('events');
const crypto = require('crypto');
const fs = require(`fs`);
const puppeteer = require('puppeteer');

var parseString = require('xml2js').parseString;

// A map to find the correct interior for a given race's ship
// This fails for some rock ship cause this isn't actually how it works
module.exports.RACE_SPECIFIC_SPRITE_MAP = {
    83: [83, 84, 83, 82, 1302, 561, 3134],  // basic lifts
    1532: [1532, 1534, 1532, 1533, 1536, 1535, 3163],  // endgame lifts
    871: [871, 872, 871, 869, 870, 873, 3135],  // armors
}

module.exports.ABILITY_MAP = {
    'DamageToSameRoomCharacters': { 'name': 'Gas', 'sprite': 2706 },
    'HealRoomHp': { 'name': 'Urgent Repair', 'sprite': 2709 },
    'HealSelfHp': { 'name': 'First Aid', 'sprite': 2707 },
    'AddReload': { 'name': 'Rush', 'sprite': 2703 },
    'FireWalk': { 'name': 'Fire Walk', 'sprite': 5389 },
    'DamageToCurrentEnemy': { 'name': 'Critical Strike', 'sprite': 2708 },
    'DamageToRoom': { 'name': 'Ultra Dismantle', 'sprite': 2710 },
    'DeductReload': { 'name': 'System Hack', 'sprite': 2704 },
    'HealSameRoomCharacters': { 'name': 'Healing Rain', 'sprite': 2705 },
    'Freeze': { 'name': 'Freeze', 'sprite': 5390 },
    'SetFire': { 'name': 'Arson', 'sprite': 5388 },
    'Bloodlust': { 'name': 'Bloodlust', 'sprite': 13866 },
    'Invulnerability': { 'name': 'Phase Shift', 'sprite': 13319 },
    'ProtectRoom': { 'name': 'Stasis Shield', 'sprite': 13320 },
    'None': { 'name': '', 'sprite': 110 }  // Empty sprite
}

module.exports.COLLECTION_ABILITY_MAP = {
    'EmpSkill': 'EMP Discharge',
    'SharpShooterSkill': 'Sharpshooter',
    'ResurrectSkill': 'Resurrection',
    'BloodThirstSkill': 'Vampirism',
    'MedicalSkill': 'Combat Medic',
    'FreezeAttackSkill': 'Cryo Field',
    'InstantKillSkill': 'Headshot',
    'None': 'None'
}

module.exports.RARITY_MAP = {
    'Legendary': 7,
    'Special': 6,
    'Hero': 5,
    'Epic': 4,
    'Unique': 3,
    'Elite': 2,
    'Common': 1,
}

module.exports.RARITY_COLOR = {
    'Common': 'grey',
    'Elite': 'white',
    'Unique': 'blue',
    'Epic': 'purple',
    'Hero': 'gold',
    'Special': 'gold',
    'Legendary': 'gold',
}

module.exports.RANK_COLOR = {
    FleetAdmiral: 'efc343',
    ViceAdmiral: 'ffff84',
    Commander: 'feb41c',
    Major: '9768d1',
    Lieutenant: '00a1d9',
    Ensign: 'ffffff'
}

module.exports.LeagueRankTrophies = LeagueRankTrophies = {
    None: [0, 499],
    Bronze: [500, 999],
    Bronze2: [1000, 1099],
    Sliver: [1100, 1199],
    Silver2: [1200, 1399],
    Gold: [1400, 1699],
    Gold2: [1700, 1999],
    Platinum: [2000, 2299],
    Platinum2: [2300, 2599],
    Diamond: [2600, 2899],
    Diamond2: [2900, 3199],
    Epic: [3200, 3599],
    Epic2: [3600, 4099],
    Champion: [4100, 4499],
    Champion2: [4500, 4999],
    Legend: [5000, 999999]
};

module.exports.LeagueRankSprites = LeagueRankSprites = {
    Bronze: 12077,
    Bronze2: 12078,
    Sliver: 12079,
    Silver2: 12080,
    Gold: 12081,
    Gold2: 12082,
    Platinum: 12083,
    Platinum2: 12084,
    Diamond: 12085,
    Diamond2: 12086,
    Epic: 12087,
    Epic2: 12088,
    Champion: 12089,
    Champion2: 12090,
    Legend: 12091
};

module.exports.ThrophiesToLeagueRank = function (Throphies = 0) {
    if (isNaN(Throphies)) return;
    const values = Object.values(LeagueRankTrophies);
    const keys = Object.keys(LeagueRankTrophies);
    var rank = keys[0];
    keys.forEach((x, i) => {
        var requirements = values[i];
        if (Throphies >= requirements[0] && Throphies <= requirements[1])
            rank = x.replace("2", "+");
    });
    return rank;
}

module.exports.RANK_BEAUTIFY = {
    FleetAdmiral: 'Fleet Admiral',
    ViceAdmiral: 'Vice Admiral',
    Commander: 'Commander',
    Major: 'Major',
    Lieutenant: 'Lieutenant',
    Ensign: 'Ensign',
}

module.exports.TYPE_PSS_API_NAME_FIELD = {
    'ship': 'ShipDesignName',
    'room': 'RoomName',
    'char': 'CharacterDesignName',
    'item': 'ItemDesignName',
    'collection': 'CollectionDesignId',
}

module.exports.DEFAULT_EXPIRATION_DURATION = 60 * 60 * 6  // 6 hours

module.exports.EQUIPMENT_SLOTS = ['Head', 'Body', 'Leg', 'Weapon', 'Accessory', 'Pet']

module.exports.SLOT_MAP = {
    'None': null,
    'EquipmentHead': 'Head',
    'EquipmentWeapon': 'Weapon',
    'EquipmentBody': 'Body',
    'EquipmentLeg': 'Leg',
    'EquipmentAccessory': 'Accessory',
    'EquipmentPet': 'Pet',
    'MineralPack': 'Mineral Pack',
    'GasPack': 'Gas Pack',
    'InstantPrize': 'Instant Prize',
    'InstantTraining': 'Instant Training',
    'ReducePrestige': 'Reduce Prestige',
    'ReduceFatigue': 'Reduce Fatigue',
    'ResetTraining': 'Reset Training',
    'AIBook': 'AI Book',
    'FillMineralStorage': 'Fill Mineral Storage',
    'FillGasStorage': 'Fill Gas Storage',
    'SpeedUpConstruction': 'SpeedUp Construction',
}

module.exports.ROOM_TYPE_MAP = {
    'Wall': 'Armor',
}

module.exports.ENHANCE_MAP = {
    'FireResistance': 'Fire Resistance',
    'FreezeAttackSkill': 'Freeze',
    'None': null
}

module.exports.RESEARCH_TYPE_MAP = {
    'CrewLevelUpCost': 'Crew LevelUp Cost',
    'ConcurrentConstruction': 'Concurrent Construction',
    'TradeCapacity': 'Trade',
    'ModuleCapacity': 'Module',
    'StickerCapacity': 'Sticker',
    'AmmoSalvageCapacity': 'Ammo Recycling',
    'CollectAll': 'Collector',
    'ItemRecycling': 'Item Recycling',
    'BoostGauge': 'Boost Gauge',
    'None': null
}

// Daily IAP mask (see https://github.com/PieInTheSky-Inc/YaDc)
module.exports.IAP_NAMES = {
    500: 'Clip',
    1200: 'Roll',
    2500: 'Stash',
    6500: 'Case',
    14000: 'Vault'
}

/* 0 - Rock?
 1 - Pirate/Dark
 2 - Fed/Blue
 3 - Qtari/Gold
 4 - Visiri/Red
 5 - UFO/Green
 6 - Starbase*/
module.exports.RACES = {
    1: "Pirate",
    2: "Federation",
    3: "Qtarian",
    4: "Visiri",
    5: "Gray",
}

/*const temp = {};
var keys = Object.keys(temp);
var out = ``;
keys.forEach(x => {
    if (isNaN(temp[x]))
        out += `\nthis.${x} = String(c.${x});`;
    else
        out += `\nthis.${x} = parseInt(c.${x});`;
})
this.log(`constructor(c) {`);
this.log(out);
this.log(`}`);
*/

module.exports.settingsModel = settingsModel = class settingsModel {
    constructor(c) {
        if (c.MaintenanceMessage) return this.log(`PSS: PIXEL STARSHIPS SERVERS ARE UNDER MAINTANANCE.\n>${c.MaintenanceMessage}<`);
        // live ops
        // also "LiveOpsId"
        this.News = c.News;
        this.NewsSpriteId = parseInt(c.NewsSpriteId);
        this.DailyRewardType = c.DailyRewardType;
        this.DailyRewardArgument = c.DailyRewardArgument;
        this.DailyItemRewards = [];
        this.SaleTitle = String(c.SaleTitle);
        this.SaleType = c.SaleType;
        this.SaleArgument = parseInt(c.SaleArgument);
        this.SaleItemMask = parseInt(c.SaleItemMask);
        this.SaleOnceOnly = (c.SaleOnceOnly === 'true');
        this.SaleQuantity = parseInt(c.SaleQuantity);
        this.SaleStartDate = new Date(c.SaleStartDate);
        this.SaleEndDate = new Date(c.SaleEndDate);
        this.CommonCrew = module.exports.characterModel.prototype;
        this.HeroCrew = module.exports.characterModel.prototype;
        /*this.DailyItemRewards = */// this.get_dailyItems(c);
        this.LimitedCatalogType = c.LimitedCatalogType;
        this.LimitedCatalogArgument = parseInt(c.LimitedCatalogArgument);
        this.LimitedCatalogQuantity = parseInt(c.LimitedCatalogQuantity);
        this.LimitedCatalogExpiryDate = new Date(c.LimitedCatalogExpiryDate);
        this.LimitedCatalogCurrencyType = String(c.LimitedCatalogCurrencyType);
        this.LimitedCatalogCurrencyAmount = parseInt(c.LimitedCatalogCurrencyAmount);
        this.LimitedCatalogMaxTotal = parseInt(c.LimitedCatalogMaxTotal);
        this.LimitedCatalogRestockQuantity = parseInt(c.LimitedCatalogRestockQuantity);
        this.CargoItems = [module.exports.itemModel.prototype];
        this.TournamentNews = String(c.TournamentNews);
        this.Crew(c);

        if (c.SettingId) { //api get
            this.SettingId = c.SettingId;
            this.ServerSettingVersion = c.ServerSettingVersion;
            this.MinimumClientVersion = c.MinimumClientVersion;
            this.MaintenanceMessage = c.MaintenanceMessage;
            this.AllianceBadgeSpriteIds = c.AllianceBadgeSpriteIds.split(',').map((i) => Number(i));
            this.FileVersion = parseInt(c.FileVersion);
            this.SpriteVersion = parseInt(c.SpriteVersion);
            this.CharacterDesignVersion = parseInt(c.CharacterDesignVersion);
            this.CharacterPartVersion = parseInt(c.CharacterPartVersion);
            this.AnimationVersion = parseInt(c.AnimationVersion);
            this.RoomDesignVersion = parseInt(c.RoomDesignVersion);
            this.MissileDesignVersion = parseInt(c.MissileDesignVersion);
            this.ResearchDesignVersion = parseInt(c.ResearchDesignVersion);
            this.RoomDesignSpriteVersion = parseInt(c.RoomDesignSpriteVersion);
            this.AchievementDesignVersion = parseInt(c.AchievementDesignVersion);
            this.ConditionTypeVersion = parseInt(c.ConditionTypeVersion);
            this.CraftDesignVersion = parseInt(c.CraftDesignVersion);
            this.ItemDesignVersion = parseInt(c.ItemDesignVersion);
            this.ActionTypeVersion = parseInt(c.ActionTypeVersion);
            this.RoomDesignPurchaseVersion = parseInt(c.RoomDesignPurchaseVersion);
            this.ShipDesignVersion = parseInt(c.ShipDesignVersion);
            this.LeagueVersion = parseInt(c.LeagueVersion);
            this.BackgroundVersion = parseInt(c.BackgroundVersion);
            this.MissionDesignVersion = parseInt(c.MissionDesignVersion);
            this.TrainingDesignVersion = parseInt(c.TrainingDesignVersion);
            this.FeatureMask = parseInt(c.FeatureMask);
            this.get_cargoItems(c);
            this.ChallengeDesignVersion = parseInt(c.ChallengeDesignVersion);
            this.ProductionServer = String(c.ProductionServer);
            this.Flags = parseInt(c.Flags);
            this.CharacterDesignActionVersion = parseInt(c.CharacterDesignActionVersion);
            this.RewardDesignVersion = parseInt(c.RewardDesignVersion);
            this.TournamentFinalDuration = parseInt(c.TournamentFinalDuration);
            this.DivisionDesignVersion = parseInt(c.DivisionDesignVersion);
            this.CollectionDesignVersion = parseInt(c.CollectionDesignVersion);
            this.RewardPointPercentage = c.RewardPointPercentage;
            this.IsDebug = (c.IsDebug === 'true');
            this.DrawDesignVersion = parseInt(c.DrawDesignVersion);
            this.AbilityDesignVersion = parseInt(c.AbilityDesignVersion);
            this.VipDesignVersion = parseInt(c.VipDesignVersion);
            this.StarSystemVersion = parseInt(c.StarSystemVersion);
            this.StarSystemLinkVersion = parseInt(c.StarSystemLinkVersion);
            this.PlanetVersion = parseInt(c.PlanetVersion);
            this.MaxDailyDraws = parseInt(c.MaxDailyDraws);
            this.CurrentAndroidVersion = c.CurrentAndroidVersion;
            this.PromotionDesignVersion = parseInt(c.PromotionDesignVersion);
            this.RewardVideoTimeReduction = parseInt(c.RewardVideoTimeReduction);
            this.ABTestingRollout = parseInt(c.ABTestingRollout);
            this.LootModifiers = String(c.LootModifiers).split(',').map((i) => Number(i));
            this.TournamentBonusScore = parseInt(c.TournamentBonusScore);
            this.SituationDesignVersion = parseInt(c.SituationDesignVersion);
            this.AFeatureMask = parseInt(c.AFeatureMask);
            this.BFeatureMask = parseInt(c.BFeatureMask);
            this.PrestigeTopCharacterDesignId = parseInt(c.PrestigeTopCharacterDesignId);
            this.ProBonoLimit = parseInt(c.ProBonoLimit);
            this.TaskDesignVersion = parseInt(c.TaskDesignVersion);
            this.NewsDesignVersion = parseInt(c.NewsDesignVersion);
            this.MinimumVersion = parseFloat(c.MinimumVersion);
            this.RecommendedVersion = parseFloat(c.RecommendedVersion);
            this.GracePeriod = parseInt(c.GracePeriod);
            this.BoostMultiplier = parseInt(c.BoostMultiplier);
            this.BoostDuration = new Date(c.BoostDuration);
            this.MaxBoostDuration = new Date(c.MaxBoostDuration);
            this.ChecksumType = c.ChecksumType;
            this.ItemDesignActionVersion = parseInt(c.ItemDesignActionVersion);
            this.ABTestingStartDate = new Date(c.ABTestingStartDate);
            this.SupportTaskRanDate = new Date(c.SupportTaskRanDate);
            this.TournamentSpriteId = parseInt(c.TournamentSpriteId);
            this.NewUserCount = parseInt(c.NewUserCount);
            this.NewsUpdateDate = new Date(c.NewsUpdateDate);
            this.ReplayAvailableDate = new Date(c.ReplayAvailableDate);
            this.BackgroundId = parseInt(c.BackgroundId);
            this.BattleBackgroundId = parseInt(c.BattleBackgroundId);
        }
        this.getTime = new Date();
    }

    async Crew(c) {
        this.CommonCrew = await this.get_crew(c.CommonCrewId);
        this.HeroCrew = await this.get_crew(c.HeroCrewId);
    }

    async get_crew(id) {
        return new Promise((resolve,) => {
            var getInter = setInterval(() => {
                if (characters && characters.length != 0) {
                    clearInterval(getInter);
                    resolve(characters.find(x => x.Id == id));
                }
            }, 100)
        });
    }

    async get_item(id) {
        return new Promise((resolve,) => {
            var getInter = setInterval(() => {
                if (items && items.length != 0) {
                    clearInterval(getInter);
                    resolve(items.find(x => x.Id == id));
                }
            }, 100)
        });
    }

    async get_cargoItems(c) {
        var output = [{
            item: module.exports.itemModel.prototype,
            count: 0,
            price: 0,
            priceType: 'starbux'
        }];
        output = [];
        let greenPrices = c.CargoPrices.split("|");
        c.CargoItems.split("|").forEach(async (x, i) => {
            let item = await this.get_item(x.split("x")[0]);
            let count = x.split("x")[1];
            let priceType = greenPrices[i].split(":")[0];
            let price = greenPrices[i].split(":")[1];
            output.push({
                item: item,
                count: count,
                price: price,
                priceType: priceType
            });
        });
        this.CargoItems = output;
        //return output;
    }

    async get_daily(c) {
        var output = [];
        c.DailyItemRewards.split("|").forEach(async (x, i) => {
            let item = await this.get_item(x.split("x")[0]);
            let count = x.split("x")[1];
            output.push({
                item: item,
                count: count,
            });
        });
        this.DailyItemRewards = output;
        //return output;
    }

    async get_live_ops(api = this) {
        const params = {
            'languageKey': 'en',
            'deviceType': 'DeviceTypeAndroid'
        }

        var endpoint = 'https://api.pixelstarships.com/LiveOpsService/GetTodayLiveOps';
        var response = await api.call(endpoint, params);

        var settings = new module.exports.settingsModel(response.LiveOpsService.GetTodayLiveOps[0].LiveOps[0]);


        var keys = Object.keys(settings);
        var self = this;
        keys.forEach(x => self[x] = settings[x]);

        return settings;
    }
}
var tempapi;
const userModel = module.exports.userModel = class userModel {
    /**
     * 
     * @param {JSON} raw Fresh profile jsonized
     * @param {module.exports.api} api The api. Wow.
     */
    constructor(raw, api) {
        if (!raw) return;
        tempapi = api;
        /**@private */
        this.raw = raw;
        const c = raw.$;
        const alliance = raw.Alliance ? raw.Alliance[0].$ : undefined;
        const UserSeason = raw.UserSeason ? raw.UserSeason[0].$ : undefined;
        this.Id = c.Id;
        this.Name = c.Name;
        if (alliance)
            this.Alliance = new module.exports.allianceModel(alliance);
        //this.Alliance = api.search_alliances(c.AllianceName,true);
        this.Alliance.Id = parseInt(c.AllianceId);
        this.Alliance.Membership = c.AllianceMembership;
        this.Alliance.SupplyDonation = parseInt(c.AllianceSupplyDonation);
        this.Alliance.Score = parseInt(c.AllianceScore);
        this.Alliance.JoinDate = new Date(c.AllianceJoinDate.replace(/T/, ' ').replace(/\..+/, ''));
        this.UserSeason = UserSeason ? {
            UserSeasonId: UserSeason.UserSeasonId,
            SeasoDesignId: UserSeason.SeasoDesignId,
            UserId: UserSeason.UserId,
            Points: UserSeason.Points,
            PurchaseVipStatus: UserSeason.PurchaseVipStatus,
            UnlcokedRewardDesignIds: UserSeason.UnlcokedRewardDesignIds,
            PurchaseVIPDate: new Date(UserSeason.PurchaseVIPDate.replace(/T/, ' ').replace(/\..+/, '')),
        } : undefined
        this.FacebookToken = c.FacebookToken;
        this.LastAlertDate = new Date(c.LastAlertDate.replace(/T/, ' ').replace(/\..+/, ''));
        this.UserType = c.UserType;
        this.GenderType = c.GenderType;
        this.RaceType = c.RaceType;
        this.GameCenterProfileImageUrl = c.ProfileImageUrl; // idk if it is or not :|
        this.Trophy = parseInt(c.Trophy);
        this.League = module.exports.ThrophiesToLeagueRank(this.Trophy);
        this.LeagueSpriteId = LeagueRankSprites[this.League.replace("+", "2")];
        this.GameCenterName = c.GameCenterName;
        this.CompletedMissionDesigns = c.CompletedMissionDesigns.split(",").map((i) => Number(i));
        this.LanguageKey = c.LanguageKey;
        this.TutorialStatus = c.TutorialStatus;
        this.SpriteId = parseInt(c.IconSpriteId);
        this.pfpurl = `https://mrtoucan.dev/assets/pss/${c.IconSpriteId}`;
        this.TipStatus = c.TipStatus;
        this.CrewDonated = parseInt(c.CrewDonated);
        this.CrewReceived = parseInt(c.CrewReceived);
        this.FreeStarbuxReceivedToday = parseInt(c.FreeStarbuxReceivedToday);
        this.DailyRewardStatus = parseInt(c.DailyRewardStatus);
        this.HeroBonusChance = parseInt(c.HeroBonusChance);
        this.GameCenterFriendCount = parseInt(c.GameCenterFriendCount);
        this.CompletedMissionEventIds = c.CompletedMissionEventIds.split(",").map((i) => Number(i));
        this.UnlockedShipDesignIds = c.UnlockedShipDesignIds;
        this.UnlockedCharacterDesignIds = c.UnlockedCharacterDesignIds;
        this.Status = c.Status;
        this.LastCatalogPurchaseDate = new Date(c.LastCatalogPurchaseDate.replace(/T/, ' ').replace(/\..+/, ''));
        this.VipExpiryDate = new Date(c.VipExpiryDate.replace(/T/, ' ').replace(/\..+/, ''));
        this.ChallengeWins = c.ChallengeWins;
        this.ChallengeLosses = c.ChallengeLosses;
        this.LoadingPercentage = c.LoadingPercentage;
        this.TotalSupplyDonation = parseInt(c.TotalSupplyDonation);
        this.DailyMissionsAttempted = c.DailyMissionsAttempted.split(",").map((i) => Number(i));
        this.PurchaseRewardPoints = c.PurchaseRewardPoints;
        this.UsedRewardPoints = c.UsedRewardPoints;
        this.GooglePlayName = c.GooglePlayName;
        this.GooglePlayIdToken = c.GooglePlayIdToken;
        this.GoolePlayAuthCode = c.GoolePlayAuthCode;
        this.TournamentRewardPoints = parseInt(c.TournamentRewardPoints);
        this.ChampionshipScore = parseInt(c.ChampionshipScore);
        this.DailyChallengeWinStreak = parseInt(c.DailyChallengeWinStreak);
        this.DrawsUsedToday = parseInt(c.DrawsUsedToday);
        this.ActivatedPromotions = c.ActivatedPromotions.split(",").map((i) => Number(i));
        this.PVPAttackWins = parseInt(c.PVPAttackWins);
        this.PVPAttackLosses = parseInt(c.PVPAttackLosses);
        this.PVPAttackDraws = parseInt(c.PVPAttackDraws);
        this.PVPDefenceDraws = parseInt(c.PVPDefenceDraws);
        this.PVPDefenceWins = parseInt(c.PVPDefenceWins);
        this.PVPDefenceLosses = parseInt(c.PVPDefenceLosses);
        this.HighestTrophy = parseInt(c.HighestTrophy);
        this.ChatAppearance = parseInt(c.ChatAppearance);
        this.AuthenticationType = c.AuthenticationType;
        this.ExploredStarSystemIds = c.ExploredStarSystemIds;
        this.TournamentBonusScore = c.TournamentBonusScore;
        this.SituationOccurrencesToday = c.SituationOccurrencesToday;
        this.Flags = c.Flags;
        this.EmailVerificationStatus = c.EmailVerificationStatus;
        this.BoostAmount = c.BoostAmount;
        this.PassPoints = c.PassPoints;
        this.MatchingStatus = c.MatchingStatus;
        this.ShipDesignId = c.ShipDesignId;
        this.Ranking = c.Ranking;
        this.TournamentResetDate = new Date(c.TournamentResetDate.replace(/T/, ' ').replace(/\..+/, ''));
        this.LastPurchaseDate = c.LastPurchaseDate;
        this.LastHeartBeatDate = new Date(c.LastHeartBeatDate.replace(/T/, ' ').replace(/\..+/, ''));
        this.LastRewardActionDate = new Date(c.LastRewardActionDate.replace(/T/, ' ').replace(/\..+/, ''));
        this.CooldownExpiry = new Date(c.CooldownExpiry.replace(/T/, ' ').replace(/\..+/, ''));
        this.FacebookTokenExpiryDate = new Date(c.FacebookTokenExpiryDate.replace(/T/, ' ').replace(/\..+/, ''));
        this.CreationDate = new Date(c.CreationDate.replace(/T/, ' ').replace(/\..+/, ''));
        this.LastLoginDate = new Date(c.LastLoginDate.replace(/T/, ' ').replace(/\..+/, ''));
        this.LastVipClaimDate = new Date(c.LastVipClaimDate.replace(/T/, ' ').replace(/\..+/, ''));
        this.ChallengeDesignId = parseInt(c.ChallengeDesignId);
        this.LastChallengeDesignId = parseInt(c.LastChallengeDesignId);
        this.CaptainUrl = `https://mrtoucan.dev/assets/pss/${parseInt(c.CaptainCharacterDesignId)}`;
        this.BlockAuthAttemptsUntilDate = new Date(c.BlockAuthAttemptsUntilDate.replace(/T/, ' ').replace(/\..+/, ''));
        this.BoostEndDate = new Date(c.BoostEndDate.replace(/T/, ' ').replace(/\..+/, ''));
        this.LastBoostDate = new Date(c.LastBoostDate.replace(/T/, ' ').replace(/\..+/, ''));
        this.UpdateDate = new Date(c.UpdateDate.replace(/T/, ' ').replace(/\..+/, ''));
        this.OwnerUserId = parseInt(c.OwnerUserId);
    }
}

module.exports.allianceModel = allianceModel = class allianceModel {
    /**
     * 
     * @param {*} c raw alliance model
     * @param {module.exports.api} api 
     */
    constructor(c, api) {
        tempapi = api;
        this.raw = c;
        this.Id = parseInt(c.AllianceId);
        this.Name = String(c.AllianceName);
        this.MinTrophyRequired = parseInt(c.MinTrophyRequired);
        this.RequiresApproval = (c.RequiresApproval === `true`);
        this.Description = String(c.AllianceDescription);
        this.CountryCode = String(c.AllianceCountryCode);
        this.EnableWars = (c.EnableWars === `true`);
        this.Credits = parseInt(c.Credits);
        this.Score = parseInt(c.Score);
        this.ChampionshipScore = parseInt(c.ChampionshipScore);
        this.Trophy = parseInt(c.Trophy);
        this.Ranking = c.Ranking;
        this.SpriteId = parseInt(c.AllianceSpriteId);
        this.ChannelId = parseInt(c.ChannelId);
        this.MembersCount = parseInt(c.NumberOfMembers);
        this.ApprovedMembers = parseInt(c.NumberOfApprovedMembers);
        this.ShipUserId = parseInt(c.AllianceShipUserId);
        this.ImmunityDate = new Date(c.ImmunityDate);
        this.DivisionDesignId = parseInt(c.DivisionDesignId);
        this.Members = api ? tempapi.get_alliance_users(this.Id) : undefined;
        //this.log(`Members: ${this.Members ? this.Members.length: 0}`);
        this.getTime = new Date();
    }
}

module.exports.shipModel = shipModel = class shipModel {
    constructor(c) {
        this.Id = parseInt(c.ShipDesignId);
        this.Name = String(c.ShipDesignName);
        this.Description = String(c.ShipDescription);
        this.Level = parseInt(c.ShipLevel);
        this.Rows = parseInt(c.Rows);
        this.Columns = parseInt(c.Columns);
        this.Mask = [];
        for (var i = 0; i < this.Rows; i++) {
            this.Mask.push([]);
            for (var i0 = this.Rows * i; i0 < (this.Rows * i) + this.Columns; i0++) {
                var x = (c.Mask.split("")[i0] === `1`);
                this.Mask[i].push(x);
            }
        }
        this.Hp = parseInt(c.Hp);
        this.MineralCost = parseInt(c.MineralCost);
        this.RepairTime = parseInt(c.RepairTime);
        this.ExteriorSpriteId = parseInt(c.ExteriorSpriteId);
        this.InteriorSpriteId = parseInt(c.InteriorSpriteId);
        this.LogoSpriteId = parseInt(c.LogoSpriteId);
        this.UpgradeTime = parseInt(c.UpgradeTime);
        this.RoomFrameSpriteId = parseInt(c.RoomFrameSpriteId);
        this.UpgradeOffsetRows = parseInt(c.UpgradeOffsetRows);
        this.UpgradeOffsetColumns = parseInt(c.UpgradeOffsetColumns);
        this.LiftSpriteId = parseInt(c.LiftSpriteId);
        this.DoorFrameLeftSpriteId = parseInt(c.DoorFrameLeftSpriteId);
        this.DoorFrameRightSpriteId = parseInt(c.DoorFrameRightSpriteId);
        this.StarbuxCost = parseInt(c.StarbuxCost);
        this.EngineX = parseInt(c.EngineX);
        this.EngineY = parseInt(c.EngineY);
        this.MineralCapacity = parseInt(c.MineralCapacity);
        this.GasCapacity = parseInt(c.GasCapacity);
        this.ThrustScale = parseInt(c.ThrustScale);
        this.FlagX = parseInt(c.FlagX);
        this.FlagY = parseInt(c.FlagY);
        this.MiniShipSpriteId = parseInt(c.MiniShipSpriteId);
        this.AllowInteracial = (c.AllowInteracial === `true`);
        this.EquipmentCapacity = parseInt(c.EquipmentCapacity);
        this.Type = String(c.ShipType);
        this.UpgradeCost = String(c.UpgradeCost);
        this.UnlockCost = parseInt(c.UnlockCost);
        this.RequirementString = parseInt(c.RequirementString);
        this.VisibilityFlags = String(c.VisibilityFlags);
        this.UnlockFromShipDesignId = parseInt(c.UnlockFromShipDesignId);
        this.RequiredResearchDesignId = parseInt(c.RequiredResearchDesignId);
        this.ThrustParticleSpriteId = parseInt(c.ThrustParticleSpriteId);
        this.ThrustLineAnimationId = parseInt(c.ThrustLineAnimationId);
        this.RequiredShipDesignId = parseInt(c.RequiredShipDesignId);
        this.RaceId = module.exports.RACES[parseInt(c.RaceId)];
        /** @private */
        this.ExteriorFileId = parseInt(c.ExteriorFileId);
        /** @private */
        this.InteriorFileId = parseInt(c.InteriorFileId);
        /** @private */
        this.LogoFileId = parseInt(c.LogoFileId);
        /** @private */
        this.RoomFrameFileId = parseInt(c.RoomFrameFileId);
        /** @private */
        this.LiftFileId = parseInt(c.LiftFileId);
        /** @private */
        this.DoorFrameLeftFileId = parseInt(c.DoorFrameLeftFileId);
        /** @private */
        this.DoorFrameRightFileId = parseInt(c.DoorFrameRightFileId);
        /** @private */
        this.ForegroundAssetId = parseInt(c.ForegroundAssetId);
        /** @private */
        this.BackgroundAssetId = parseInt(c.BackgroundAssetId);

        const keys = Object.keys(this);
        var self = this;
        keys.forEach(x => {
            if (x.includes(`FileId`))
                self[x.replace(`FileId`, ``)] = sprites.find(y => y.fileid == self[x]);
            if (x.includes(`SpriteId`))
                self[x.replace(`SpriteId`, ``)] = sprites.find(y => y.id == self[x]);
        });
    }
}

module.exports.roomModel = roomModel = class roomModel {
    constructor(c) {
        this.RoomId = parseInt(c.RoomId);
        this.RoomDesignId = parseInt(c.RoomDesignId);
        this.ShipId = parseInt(c.ShipId);
        this.RoomStatus = String(c.RoomStatus);
        this.Row = parseInt(c.Row);
        this.Column = parseInt(c.Column);
        this.Manufactured = parseInt(c.Manufactured);
        this.RandomSeed = parseInt(c.RandomSeed);
        this.CapacityUsed = parseInt(c.CapacityUsed);
        this.ItemIds = parseInt(c.ItemIds);
        this.SalvageString = String(c.SalvageString);
        this.ManufactureString = String(c.ManufactureString);
        this.TargetManufactureString = parseInt(c.TargetManufactureString);
        this.PowerGenerated = parseInt(c.PowerGenerated);
        this.ManufactureStartDate = new Date(c.ManufactureStartDate.replace(/T/, ' ').replace(/\..+/, ''));
        this.ConstructionStartDate = String(c.ConstructionStartDate);
        this.UpgradeRoomDesignId = parseInt(c.UpgradeRoomDesignId);
    }
}

module.exports.spriteModel = spriteModel = class spriteModel {
    constructor(c) { // much cleaner, much more understandable.. Right?
        this.id = parseInt(c.SpriteId);
        this.fileid = parseInt(c.ImageFileId);
        this.x = parseInt(c.X);
        this.y = parseInt(c.Y);
        this.width = parseInt(c.Width);
        this.height = parseInt(c.Height);
        this.key = String(c.SpriteKey);
    }
}

module.exports.roomSpriteModel = roomSpriteModel = class roomSpriteModel {
    constructor(c) {
        this.RoomDesignSpriteId = parseInt(c.RoomDesignSpriteId);
        this.RoomDesignId = parseInt(c.RoomDesignId);
        this.SpriteId = parseInt(c.SpriteId);
        this.RoomSpriteType = String(c.RoomSpriteType);
        this.RoomEffectType = String(c.RoomEffectType);
        this.RoomEffectParameter = parseInt(c.RoomEffectParameter);
        this.RaceId = parseInt(c.RaceId);
        this.AnimationId = parseInt(c.AnimationId);
    }
}

module.exports.characterModel = characterModel = class characterModel {
    constructor(c) {
        this.Id = parseInt(c.CharacterDesignId);
        this.Name = c.CharacterDesignName;
        this.HeadPartId = parseInt(c.CharacterHeadPartId);
        this.BodyPartId = parseInt(c.CharacterBodyPartId);
        this.LegPartId = parseInt(c.CharacterLegPartId);
        this.GenderType = c.GenderType;
        this.RaceType = c.RaceType;
        this.Hp = parseInt(c.Hp);
        this.Pilot = parseInt(c.Pilot);
        this.Attack = parseInt(c.Attack);
        this.FireResistance = parseInt(c.FireResistancev);
        this.Repair = parseInt(c.Repair);
        this.Weapon = parseInt(c.Weapon);
        this.Science = parseInt(c.Science);
        this.Engine = parseInt(c.Engine);
        this.Research = parseInt(c.Research);
        this.Level = parseInt(c.Level);
        this.WalkingSpeed = parseInt(c.WalkingSpeed);
        this.MinShipLevel = parseInt(c.MinShipLevel);
        this.FinalHp = parseFloat(c.FinalHp);
        this.FinalPilot = parseFloat(c.FinalPilot);
        this.FinalAttack = parseFloat(c.FinalAttack);
        this.FinalRepair = parseFloat(c.FinalRepair);
        this.FinalWeapon = parseFloat(c.FinalWeapon);
        this.FinalScience = parseFloat(c.FinalScience);
        this.FinalEngine = parseFloat(c.FinalEngine);
        this.FinalResearch = parseFloat(c.FinalResearch);
        this.Rarity = c.Rarity;
        this.ProgressionType = c.ProgressionType;
        this.DesignDescription = c.CharacterDesignDescription;
        this.XpRequirementScale = parseInt(c.XpRequirementScale);
        this.MaxCharacterLevel = parseInt(c.MaxCharacterLevel);
        this.SpecialAbilityType = c.SpecialAbilityType;
        this.SpecialAbilityArgument = parseInt(c.SpecialAbilityArgument);
        this.SpecialAbilityFinalArgument = parseInt(c.SpecialAbilityFinalArgument);
        this.ProfileSpriteId = parseInt(c.ProfileSpriteId);
        this.RunSpeed = parseInt(c.RunSpeed);
        this.TrainingCapacity = parseInt(c.TrainingCapacity);
        this.EquipmentMask = parseInt(c.EquipmentMask);
        this.SpeechVoice = c.SpeechVoice;
        this.SpeechPhrases = c.SpeechPhrases;
        this.SpeechRate = parseInt(c.SpeechRate);
        this.SpeechPitch = parseInt(c.SpeechPitch);
        this.Flags = parseInt(c.Flags);
        this.RootCharacterDesignId = c.RootCharacterDesignId;
        this.TapSoundFileId = parseInt(c.TapSoundFileId);
        this.ActionSoundFileId = parseInt(c.ActionSoundFileId);
        this.CollectionDesignId = parseInt(c.CollectionDesignId);
    }
}

module.exports.itemModel = itemModel = class itemModel {
    constructor(c) {
        this.Id = parseInt(c.ItemDesignId);
        this.Name = c.ItemDesignName;
        this.Key = c.ItemDesignKey;
        this.Description = c.ItemDesignDescription;
        this.ImageSpriteId = parseInt(c.ImageSpriteId);
        this.LogoSpriteId = parseInt(c.LogoSpriteId);
        this.ItemSpace = parseInt(c.ItemSpace);
        this.Type = c.ItemType;
        this.GasCost = parseInt(c.GasCost);
        this.MineralCost = parseInt(c.MineralCost);
        this.Rank = parseInt(c.Rank);
        this.MinRoomLevel = parseInt(c.MinRoomLevel);
        this.BuildTime = parseInt(c.BuildTime);
        this.RootItemDesignId = parseInt(c.RootItemDesignId);
        this.ItemSubType = c.ItemSubType;
        this.EnhancementType = c.EnhancementType;
        this.EnhancementValue = parseInt(c.EnhancementValue);
        this.MarketPrice = parseInt(c.MarketPrice);
        this.DropChance = parseInt(c.DropChance);
        this.Ingredients = c.Ingredients;
        this.Rarity = c.Rarity;
        this.ModuleType = c.ModuleType;
        this.ModuleArgument = parseInt(c.ModuleArgument);
        this.Flags = parseInt(c.Flags);
        this.FairPrice = parseInt(c.FairPrice);
        this.MinShipLevel = parseInt(c.MinShipLevel);
        this.ManufactureCost = c.ManufactureCost;
        this.NameEN = c.ItemDesignNameEN;
        this.Content = c.Content;
        this.Metadata = c.Metadata;
        this.Priority = parseInt(c.Priority);
        this.RequirementString = c.RequirementString;
        this.RaceId = parseInt(c.RaceId);
        this.RequiredResearchDesignId = parseInt(c.RequiredResearchDesignId);
        this.ParentItemDesignId = parseInt(c.ParentItemDesignId);
        this.CraftDesignId = parseInt(c.CraftDesignId);
        this.MissileDesignId = parseInt(c.MissileDesignId);
        this.CharacterPartId = parseInt(c.CharacterPartId);
        this.ActiveAnimationId = parseInt(c.ActiveAnimationId);
        this.AnimationId = parseInt(c.AnimationId);
        this.BorderSpriteId = parseInt(c.BorderSpriteId);
        this.SoundFileId = parseInt(c.SoundFileId);
        this.CharacterDesignId = parseInt(c.CharacterDesignId);
        this.TrainingDesignId = parseInt(c.TrainingDesignId);
        this.RoomDesignId = parseInt(c.RoomDesignId);
        this.ParticleSpriteId = parseInt(c.ParticleSpriteId);
        this.EquipSoundFileId = parseInt(c.EquipSoundFileId);
    }
}

const Device = class Device {
    constructor() {
        this.deviceType = `DeviceTypeMac`; // keep this fucker here or i will blow a fuse.
        this.key = this.create_device_key();
        this.checksum = this.create_device_checksum();
        this.token = ``;//this.get_token(api);
        this.expires_at = new Date();
    }

    static parse(int) {
        function p(i) {
            var newd = new Device();
            newd.deviceType = i.deviceType;
            newd.key = i.key;
            newd.checksum = i.checksum;
            newd.token = i.token;
            newd.expires_at = new Date(i.expires_at.replace(/T/, ' ').replace(/\..+/, ''));
            return newd;
        }
        if (Array.isArray(int)) {
            var out = [];
            int.forEach(x => out.push(p(x)));
            return out;
        } else return p(int);
    }

    /*async update_token(api = new module.exports.api()) {
        this.token = await this.get_token(api);
    }*/

    /**
     * update the token
     * @param {module.exports.api} api 
     * @returns this.token
     */
    async get_token(api = new module.exports.api()) {
        if (!this.token || this.expires_at < new Date())
            await this.cycle_token(api);

        return this.token;
    }

    async cycle_token(api = new module.exports.api()) {
        var newToken = await api.get_device_token(this);
        if (!newToken) return this.log(`Device failed token cycle.`);
        this.token = newToken;
        this.expires_at = new Date(new Date().getTime() + (12 * 60 * 60 * 1000)); // +12h
    }

    create_device_key() {
        //Generate random device key.

        function choice(input = "") {
            var inp = input.split("");
            return inp[Math.floor(Math.random() * inp.length)];
        }

        const sequence = `0123456789abcdef`;
        return ''
            + choice(sequence)
            + choice('26ae')
            + choice(sequence)
            + choice(sequence)
            + choice(sequence)
            + choice(sequence)
            + choice(sequence)
            + choice(sequence)
            + choice(sequence)
            + choice(sequence)
            + choice(sequence)
            + choice(sequence);
        //return Buffer.from(require('uuid').v1(), 'utf8').toString('hex').slice(12);
    }

    create_device_checksum() {
        var md5sum = crypto.createHash('md5');
        md5sum.update(new Buffer.from(`${this.key}${this.deviceType}savysoda`, 'utf-8'));
        const device_checksum = md5sum.digest('hex');

        return device_checksum;
    }
}
module.exports.Device = Device;

class cache { // fuck you and your mysql
    constructor(path = `./pssApiCache.json`, validTime = 10) {
        this.cache = {
            /** @type {module.exports.settingsModel} */
            api: null,
            /** @type {module.exports.itemModel[]} */
            items: [],
            /** @type {module.exports.characterModel[]} */
            characters: [],
            /** @type {module.exports.itemModel[]} */
            sprites: [],
            /** @type {module.exports.shipModel[]} */
            ships: [],
            /** @type {module.exports.userModel[]} */
            users: [],
            /** @type {module.exports.allianceModel[]} */
            fleets: [],
        }
        this.path = path;
        this.validTime = validTime; //min
    }

    valid(date) {
        return date.getTime() + (this.validTime * 60 * 1000) > new Date().getTime();
    }

    update(key, data, id = true) {
        const curKeys = Object.keys(this.cache);
        if (!curKeys.includes(key)) throw new Error(`Dont have >${key}< as a key.`);
        var c = this.cache[key];
        if (id && Array.isArray(c)) {
            var d = c.find(x => x.Id == data.Id);
        } else
            c = data;
    }

    async loadCache(path = this.path) {
        this.log(`Loading cache... ${this.path}`);
        if (!fs.existsSync(path)) { fs.writeFileSync(path, '[]'); return this.loadCache(path); }
        const rawcache = fs.readFileSync(path, 'utf8');
        //this.log(rawcache);
        if (!rawcache || !JSON.parse(rawcache)) return this.saveCache();
        var cache = JSON.parse(rawcache);
        const cacheKeys = Object.keys(cache);
        const curKeys = Object.keys(this.cache);

        var self = this;
        cacheKeys.forEach(x => {
            if (curKeys.includes(x))
                self.cache[x] = cache[x];
        });

        this.saveCache();
        this.log(`Cache loaded`);
        return cache;
    }

    lastUpdateCache = undefined;
    /**
     * save data into a "cache" (even thought its a file) 
     * @returns {new Promise<cache>} cache
     */
    saveCache() {
        if (this.lastUpdateCache != this.cache)
            return new Promise((resolve) => {
                this.lastUpdateCache = this.cache;
                this.log(this.path);
                fs.writeFile(this.path, JSON.stringify(this.cache), (err) => {
                    if (err) throw err;
                    resolve(this.cache);
                });
            });
        else this.log(`already cache saved`);
    }
}

var items = [module.exports.itemModel.prototype];
items = [];
var characters = [module.exports.characterModel.prototype];
characters = [];
var sprites = [module.exports.spriteModel.prototype];
sprites = [];
var ships = [module.exports.shipModel.prototype];
ships = [];
var users = [module.exports.userModel.prototype];
users = [];
var fleets = [module.exports.allianceModel.prototype];
fleets = [];

module.exports.api = class api extends ev {
    TOKEN_EXPIRED_REGEX = 'errorMessage[^>]*ccess token';
    INSPECT_SHIP_ERROR = 'InspectShip errorMessage=';
    EXPIRED_TOKEN_RESP = '<InspectShip errorMessage="Access token expired." />';
    FAILED_AUTH = '<InspectShip errorMessage="GetShip: Failed to authorize access token." />';
    EXPIRED_TOKEN_RESP2 = '<ListUsersByRanking errorMessage="Failed to authorize access token." />';

    MIN_DEVICES = 1;
    PSS_START_DATE = new Date(2015, 12, 6);// new Date(2016, 1, 6);

    DEBUG = false;

    IAP_OPTIONS_MASK_LOOKUP = [
        500,
        1200,
        2500,
        6500,
        14000
    ];
    cachePath = `./pssApiCache.json`;
    spritesFolder = `./pss/`;

    //items = items;
    get items() {
        return items;
    }
    //characters = characters;
    get characters() {
        return characters;
    }
    get sprites() {
        return sprites;
    }
    get ships() {
        return ships;
    }
    get rooms() {
        return rooms;
    }

    /**
     * @class
     * @constructor
     */
    constructor() {
        super();
        /** @type {module.exports.settingsModel} */
        this.api_settings = {};
        /**@type {string} */
        this.server = this.api_settings.ProductionServer;
        this.device_next_index = 0;
        /**
         * Devices
         * @type {Device[]}
         */
        this.devices = [];
        this.init();
    }

    /*onlist = {};
    on(key = "ready", callback = () => { }) {
        if (!this.onlist[key])
            this.onlist[key] = [];
        Array(this.onlist[key]).push(callback);
    }

    callEvent(key = `ready`, args = {}) {
        if (this.onlist[key])
            Array(this.onlist[key]).forEach(x => x(args));
    }*/

    async loadCache(path = this.cachePath) {
        this.log(`Loading cache... ${this.cachePath}`);
        if (!fs.existsSync(path)) { fs.writeFileSync(path, '[]'); return this.loadCache(path); }
        const rawcache = fs.readFileSync(path, 'utf8');
        //this.log(rawcache);
        if (!rawcache || !JSON.parse(rawcache)) return this.saveCache();
        var cache = JSON.parse(rawcache);
        if (!cache || !cache.api) cache = await this.saveCache();
        const cacheApiKeys = Object.keys(cache.api);
        var cacheValid = [];
        cacheApiKeys.forEach((k, i) => {
            const v = cache.api[k];
            if (k.toLocaleLowerCase().includes('version')) {
                if (!this.api_settings[k] || this.api_settings[k] != v) cacheValid[k] = false;
            }
        });
        // Update to latest
        if (!cache.api || new Date(cache.api.getTime).getTime() + 86400000 > new Date().getTime()) // 86400000 = 1day in ms
            cache.api = await this.get_api_settings();
        if (cacheValid.ItemDesignVersion || !cache.items || cache.items.length == 0)
            cache.items = await this.get_items();
        if (cacheValid.CharecterDesignVersion || !cache.characters || cache.characters.length == 0)
            cache.characters = await this.get_characters();
        if (cacheValid.SpriteVersion || !cache.sprites || cache.sprites.length == 0)
            cache.sprites = await this.get_sprites();
        if (cacheValid.ShipDesignVersion || !cache.ships || cache.ships.length == 0)
            cache.ships = await this.get_ships();
        if (cacheValid.RoomDesignSpriteVersion || !cache.rooms || cache.rooms.length == 0)
            cache.rooms = await this.get_rooms_sprites();

        this.devices = Device.parse(cache.devices);

        items = cache.items;
        characters = cache.characters;
        sprites = cache.sprites;
        ships = cache.ships;
        ships = cache.ships;
        this.saveCache();
        this.log(`Cache loaded`);

        return cache;
    }

    lastUpdateCache = undefined;
    cache = {
        api: this.api_settings,
        items: this.items,
        characters: this.characters,
        sprites: this.sprites,
        ships: this.ships,
        devices: this.devices,
        users: users,
        fleets: fleets,
    };
    /**
     * save data into a "cache" (even thought its a file) 
     * @returns cache
     */
    saveCache() {
        this.cache = {
            api: this.api_settings,
            items: this.items,
            characters: this.characters,
            sprites: this.sprites,
            ships: this.ships,
            devices: this.devices,
            users: users,
            fleets: fleets,
        };
        if (this.lastUpdateCache != this.cache)
            return new Promise((resolve,) => {
                this.lastUpdateCache = this.cache;
                fs.writeFile(this.cachePath, JSON.stringify(this.cache), (err) => {
                    if (err) throw err;
                    resolve(this.cache);
                });
            });
        else this.log(`already cache saved`);
    }

    async init() {
        var self = this; // so fucking dumb.
        /**
         * @private
         * @param {string} log 
         */
        this.log = function (log) {
            if (self.DEBUG)
                console.log(log);
        }

        this.api_settings = await this.get_api_settings();
        this.api_settings.get_live_ops(this); // dosent need device
        this.cache = await this.loadCache();

        var newdevs = this.generate_devices();
        this.log(`PSS: Generated ${newdevs.length}/${this.devices.length} devices`);
        setInterval(async () => await this.saveCache(), 300000);//5min
        /*process.on('SIGINT', async () => {
            this.log(`PSS: sigint. Saving...`);
            await this.saveCache();
            this.log(`PSS: Saved.`);
            process.exit();
        });*/
        this.emit(`ready`);
        setInterval(async () => {
            if (this.api_settings.getTime < this.api_settings.SaleEndDate) // expired
                this.api_settings = await this.get_api_settings();
        }, 60000); //1min
    }

    multiParseInt(input = {}) {
        var output = {};
        const values = Object.values(input);
        Object.keys((k, i) => {
            const parsed = parseInt(values[i]);
            if (!isNaN(parsed))
                output[k] = parsed;
        });
    }

    /**
     * Updates and adds new devices to the device list
     * @private
     * @returns {Device[]} Returns the newly added devices
     */
    get_devices() {
        var newDevices = [];
        for (var i = this.devices.length; i < this.MIN_DEVICES; i++) {
            const new_device = new Device();
            this.devices.push(new_device);
            newDevices.push(new_device);
        }

        return newDevices;
    }

    /**
     * Updates and adds new devices to the device list
     * @returns {Device[]} Returns the newly added devices
     */
    generate_devices() {
        var newdevices = this.get_devices();
        this.devices.concat(newdevices);
        return newdevices;
    }

    /**
     * Make a PSS API call.
     * @param {string} endpoint 
     * @param {JSON} params 
     * @param {boolean} access Adds authentication token from device list
     * @returns {JSON}
     */
    async call(endpoint = "", params = {}, access = false) {
        //this.log(`ENDPOINT: ${endpoint}`);
        // protected endpoint, add device access token
        var device = null;
        if (access) {
            device = this.device(this.devices);
            params.accessToken = await device.get_token(this);
            //params.deviceType= 'DeviceTypeAndroid';
        }

        endpoint += "?";
        const pK = Object.keys(params);
        Object.values(params).forEach((x, i) => endpoint += `${pK[i]}=${x}&`);
        endpoint.replace(/ /, `%20`);

        var response = await getBuffer(endpoint).catch(e => this.log(`PSS: call error ${endpoint} | ${e}`));
        if (!response) return;

        // expired token, regenerate tokens and retry
        if (device && String(response.text).includes(this.TOKEN_EXPIRED_REGEX)) {
            device.cycle_token(this);
            params.accessToken = device.get_token(this);
            response = await getBuffer(endpoint);
        }

        parseString(response, function (err, result) {
            if (err) throw err;
            /*var cutUpEndpoint = ENDPOINT.split("/");
            cutUpEndpoint = cutUpEndpoint.slice(cutUpEndpoint.findIndex(x => x.includes(".com"))+1,cutUpEndpoint.length);
            cutUpEndpoint.forEach(x => response = result[x]);*/
            response = result;
        });
        var k = Object.keys(response);
        if (response[k[0]] && response[k[0]].$ && response[k[0]].$.errorMessage) {
            const err = response[k[0]].$.errorMessage;
            this.log(err);
            if (err == 'Failed to authorize access token.')
                await device.cycle_token(this);
        }
        //this.log(`RESPONSE:`);
        //this.log(JSON.stringify(response));
        return response;
    }

    async post(endpoint = "", params = {}) {
        //Make a PSS API post.
        endpoint += "?";
        const pK = Object.keys(params);
        Object.values(params).forEach((x, i) => endpoint += `${pK[i]}=${x}&`);

        async function doRequest(url = "") {
            var url0 = url.split(".com");
            const post = bent(`${url0[0]}.com`, 'POST', 'string');
            return await post(url0[1]);
        }
        var response = await doRequest(endpoint);
        parseString(response, function (err, result) {
            if (err) throw err;
            response = result;
        });
        return response;
    }

    /**
     * Gets api settings.
     * @returns {module.exports.settingsModel} Settings
     */
    async get_api_settings() {
        //Get last game settings from API.

        const params = {
            'languageKey': 'en',
            'deviceType': 'DeviceTypeAndroid'
        }

        var endpoint = 'https://api.pixelstarships.com/SettingService/getlatestversion3';
        var response = await this.call(endpoint, params);

        if (!response) {
            // servers are always supposed to return something valid, but don't always
            endpoint = 'https://api2.pixelstarships.com/SettingService/getlatestversion3';
            response = await this.call(endpoint, params);
        }

        var settings = new module.exports.settingsModel(response.SettingService.GetLatestSetting[0].Setting[0].$);
        /*var fixed_endpoint = `https://${settings["ProductionServer"]}/SettingService/getlatestversion3`;

        if (fixed_endpoint != endpoint) {
            response = await this.call(fixed_endpoint, params)
            settings = response.find(".//Setting").attrib
        }*/

        this.server = settings.ProductionServer;
        return settings;
    }

    /*async generate_key(key = this.generate_device()[0]) {
        const params = {
            'deviceKey': key,
        }

        // retrieve data as XML from Pixel Starships API
        const endpoint = `https://${this.server}/UserService/GenerateKey`;
        const response = await this.call(endpoint, params, true);
        this.log(response);
        //key = userKey

        return inspect_ship;
    }*/

    /**
     * Gets a random device from the devices for use in the api
     * @returns {Device} Returned device
     */
    device(dvs = this.devices) {
        //Get the next device.

        /*if (!this.devices)
            this.devices = [];
        if (this.devices.length == 0)
            await this.loadDevices();
        if (this.device_next_index > this.devices.length)
            this.device_next_index = 0;

        var device = this.devices[this.device_next_index];
        this.device_next_index += 1;*/
        if (!dvs || dvs.length == 0) {
            const nd = new Device();
            return nd;
        }
        var d = dvs[Math.floor(Math.random() * dvs.length)];
        return d;
    }

    /**
     * Get device token from API for the given generated device.
     * @param {Device} Device Input device
     * @returns {sring} AccessToken
     */
    async get_device_token(device = new Device()) {
        const params = {
            'deviceKey': device.key,
            'checksum': device.checksum,
            'isJailBroken': 'false',
            'deviceType': device.deviceType,
            'languagekey': 'en',
            'advertisingKey': '""',
        }

        const endpoint = `https://${this.server}/UserService/DeviceLogin8`;
        const response = await this.post(endpoint, params);
        /*
                {
                    '$': {
                        accessToken: '2d5482ba-563b-48c5-8755-436ffbf33537',
                        PreviousLastLoginDate: '2021-08-17T00:00:00',
                        UserId: '8659126'
                    },
                    User: [{ '$': [Object] }]
                }
        
                {
                    UserLogin: {
                        '$': {
                            errorMessage: 'You have created many accounts in a short period of time. Please try again in 24 hours.'
                        }
                    }
                }
        */
        if (response.UserLogin && response.UserLogin.$ && response.UserLogin.$.errorMessage != null)
            this.log(`Device login token error: ${response.UserLogin.$.errorMessage}`);
        else
            if (response.UserService.UserLogin[0] && response.UserService.UserLogin[0].$ && response.UserService.UserLogin[0].$.accessToken)
                return response.UserService.UserLogin[0].$.accessToken;
            else this.log(`Device token error: ${JSON.stringify(response.UserLogin)}`);
        return "";
    }

    async inspect_ship(user_id) {
        //Get player ship data from API.

        const params = {
            'userId': user_id,
            'version': this.api_settings['ShipDesignVersion']
        }

        // retrieve data as XML from Pixel Starships API
        const endpoint = `https://${this.server}/ShipService/InspectShip2`;
        const response = await this.call(endpoint, params, true);
        this.log(`INSPECT SHIP`);
        this.log(response.ShipService.InspectShip[0]);
        if (this.DEBUG)
            fs.writeFileSync('./inspectship.json', JSON.stringify(response.ShipService.InspectShip[0]));
        var out = {
            user: new userModel(response.ShipService.InspectShip[0].User.$),
            ship: new module.exports.shipModel(response.ShipService.InspectShip[0].Ship.$),
            rooms: response.ShipService.InspectShip[0].Ship.Rooms[0].Room.map(x => new module.exports.roomModel(x)),
        }

        return out;
    };

    async get_ship(user_id) {
        const params = {
            'userId': user_id,
        }

        // retrieve data as XML from Pixel Starships API
        const endpoint = `https://${this.server}/ShipService/GetShipByUserId`;
        const response = await this.call(endpoint, params, true);
        this.log(`GET SHIP`);
        if (this.DEBUG)
            fs.writeFileSync('./getship.json', JSON.stringify(response));

        //return inspect_ship;
    }

    /**
     * Gives starbux to the user. Uses floating starbuxs as a basis. Cation is advised
     * @param {Device} device User ID
     */
    async add_starbux(device = Device.prototype, quantity = 1) {
        const params = {
            'quantity': quantity,
            'clientDateTime': new Date().toISOString().replace(/\..+/, ''),
            'checksum': device.checksum,
            'accessToken': device.token,
        }

        // retrieve data as XML from Pixel Starships API
        const endpoint = `https://${this.server}/UserService/addStarbux2`;
        const response = await this.post(endpoint, params);
        this.log(response);
        return response;
    }

    parse_user_node(user_node) {
        //Extract user data from XML node.
        return user_node.UserService.SearchUsers[0].Users[0].User[0].$;
    }

    userCache(u, key = 'Name') {
        if (typeof (u) == String) {
            var c = users.find(x => x.Id == u);
            if (c.getTime.getTime() + 600000 > new Date().getTime()) //10min
                return c;
            else return;
        } else {
            var c = users.find(x => x.Id == u.Id);
            if (c)
                c = u;
            else users.push(u);
        }
    }

    /**
     * Search for users or a specific user.
     * @param {string} user_name User name
     * @param {boolean} exact_match Is it a general search or a specific one
     * @returns {userModel} User 
     */
    async search_users(user_name = "", exact_match = false) {
        while (!this.server) { }; // Dont continue until settings are ready.
        const params = {
            'searchstring': user_name,
        }

        // retrieve data as XML from Pixel Starships API
        const endpoint = `https://${this.server}/UserService/SearchUsers`;
        var c = this.userCache(user_name);
        if (c) return c;
        var response = await this.call(endpoint, params);
        if (!response) return this.log(`Failed to get >${user_name}<`);

        if (exact_match) {
            if (response.UserService.SearchUsers[0].Users[0] == "") return;//users; // This is disgustingly long.
            const raw = response.UserService.SearchUsers[0].Users[0].User[0];
            const user = new module.exports.userModel(response.UserService.SearchUsers[0].Users[0].User[0], this);
            this.userCache(user);
            return user;
        } else {
            var users = [];
            response.UserService.SearchUsers[0].Users.forEach(u => {
                users.push(new module.exports.userModel(u, this));
            });

            return users;
        }
    }

    async search_usersid(id = "", exact_match = false) {
        while (!this.server) { }; // Dont continue until settings are ready.
        const params = {
            'searchid': id,
        }

        // retrieve data as XML from Pixel Starships API
        const endpoint = `https://${this.server}/UserService/SearchUsers`;
        var response = await this.call(endpoint, params)

        this.log(response);
    }

    async market() {
        while (!this.server) { }; // Dont continue until settings are ready.
        const params = {
            'itemSubType': `none`,
            'rarity': `none`,
            'currencyType': `Unknown`,
            'itemDesignId': 0,
            'userId': 0,
        }

        // retrieve data as XML from Pixel Starships API
        const endpoint = `https://${this.server}/MessageService/ListActiveMarketplaceMessages5`;
        var response = await this.call(endpoint, params, true)

        this.log(JSON.stringify(response));
    }

    /**
     * Get fleet by name
     * @param {string} name Fleet name 
     * @param {boolean} exact_match 
     * @returns {module.exports.allianceModel}
     */
    async search_alliances(name = "", exact_match = false) {
        function fleetCache(u, key = 'Name') {
            if (typeof (u) == String) {
                var c = users.find(x => x.Id == u);
                if (c.getTime.getTime() + 600000 > new Date().getTime()) //10min
                    return c;
                else return;
            } else {
                var c = users.find(x => x.Id == u.Id);
                if (c)
                    c = u;
                else users.push(u);
            }
        }

        var c = fleetCache(name);
        if (c) return c;

        const params = {
            'name': name,
            'skip': 0,
            'take': 25,
        }

        // retrieve data as XML from Pixel Starships API
        const endpoint = `https://${this.server}/AllianceService/SearchAlliances`;
        const response = await this.call(endpoint, params, true);

        var alliances = [];

        if (!response.AllianceService.SearchAlliances[0].Alliances[0].Alliance) return;
        const self = this;
        response.AllianceService.SearchAlliances[0].Alliances[0].Alliance.forEach(x => alliances.push(new allianceModel(x.$, self)));

        alliances.forEach(x => fleetCache(x));
        if (exact_match && alliances.length != 0)
            return alliances.find(x => x.Name == name);
        return alliances;
    }

    /**
     * Get alliance users by id
     * @param {int} id Alliance id 
     * @param {int} skip 
     * @param {int} take 
     * @returns {allianceModel}
     */
    async get_alliance_users(id, skip = 0, take = 100) {
        //Get alliance users from API, top 100 by default.

        const params = {
            'allianceId': id,
            'take': take,
            'skip': skip
        }

        // retrieve data as XML from Pixel Starships API
        const endpoint = `https://${this.server}/AllianceService/ListUsers2`;
        const response = await this.call(endpoint, params, true);

        var users = [];
        if (!response) return users;
        if (!response.AllianceService) return this.log(`ALLIANCE SERVICE NOT FOUND: ${JSON.stringify(response)}`);
        if (response.AllianceService.ListUsers[0].Users && response.AllianceService.ListUsers[0].Users.length != 0) {
            response.AllianceService.ListUsers[0].Users[0].User.forEach(u => users.push(new userModel(u)));
        }

        return users
    }

    async get_sprites() {
        //Get sprites from API.

        const params = {
            'version': this.api_settings['FileVersion'],
            'deviceType': 'DeviceTypeAndroid'
        }

        // retrieve data as XML from Pixel Starships API
        const endpoint = `https://${this.server}/FileService/ListSprites`;
        const response = await this.call(endpoint, params);

        var sprites = [module.exports.spriteModel.prototype];
        sprites = [];
        if (!response.FileService.ListSprites[0].Sprites) return;

        response.FileService.ListSprites[0].Sprites.forEach(x => {
            x.Sprite.forEach(y => sprites.push(new module.exports.spriteModel(y.$)));
        });

        return sprites
    }

    async download_sprites(path = this.spritesFolder, force = false, ultra = false) {
        function msToTime(duration) {
            var milliseconds = Math.floor((duration % 1000) / 100),
                seconds = Math.floor((duration / 1000) % 60),
                minutes = Math.floor((duration / (1000 * 60)) % 60),
                hours = Math.floor((duration / (1000 * 60 * 60)) % 24);

            hours = (hours < 10) ? "0" + hours : hours;
            minutes = (minutes < 10) ? "0" + minutes : minutes;
            seconds = (seconds < 10) ? "0" + seconds : seconds;

            return `${hours}h ${minutes}min ${seconds}.${milliseconds}s`;
        }

        if (!fs.existsSync(path)) return this.log(`No path to the sprites folder! ${path}`);
        var result = this.sprite;
        this.log(`sprites ${result.length}`);
        var waitTime = 0; //ms, extra wait time
        const startTime = new Date();
        var doneCount = 0;
        var errorCount = 0;
        if (force)
            this.log(`Forcing downloads...`);
        if (ultra)
            this.log(`Ultra download!`);
        var finishedDownloads = 0;
        var downloadTimes = 0; //ms
        if (!ultra)
            download();
        else result.forEach((x, i) => download(i));
        function download(i = 0, backup = false) {
            var num = result[i] ? result[i].fileid : undefined;
            if (!num) return this.log(`Finished ${i}`);
            var url = `http://dokfcbc7esdbx.cloudfront.net/${num}.png`;
            if (backup)
                url = `https://pixelstarships.s3.amazonaws.com/${num}.png`;

            var https = require('http');
            if (url.includes(`https://`))
                https = require('https');
            const fs = require('fs');

            if ((!fs.existsSync(path) || force) && num) {
                this.log(`Downloading ${num}`);
                var downloadStarted = new Date().getTime();
                const req = https.get(url, (res) => {
                    const filePath = fs.createWriteStream(path);
                    res.pipe(filePath);
                    filePath.on('finish', () => {
                        filePath.close();
                        doneCount++;
                        finishedDownloads++;
                        downloadTimes += downlToadStarted - new Date().getTime();
                        var exWaitTime = (waitime + (downloadTimes / finishedDownloads)) * result.length; //ms
                        this.log(`\nDownloaded ${result[i].key} ${num}\n${((doneCount / result.length) * 100).toFixed(2)}% ${result.length}/${doneCount}\nExcpected wait time: ${msToTime(exWaitTime)}\nElapsed time: ${msToTime(new Date().getTime() - startTime.getTime())}\nErrors: ${errorCount} ${((errorCount / result.length) * 100).toFixed(2)}%`);
                        if (backup)
                            errorCount--;
                        i++;
                        if (i <= result.length && !ultra)
                            setTimeout(() => download(i), waitTime);
                    });
                });
                req.on('error', (err) => {
                    //this.log(`FAILED TO DOWNLOAD ${num}`);
                    errorCount++;
                    setTimeout(() => download(i, true), 5000);
                });
            } else {
                doneCount++;
                i++;
                if (i <= result.length && !ultra)
                    setTimeout(() => download(i), 50);
                //this.log(`Download Excists ${num}\n${((doneCount / result.length) * 100).toFixed(2)}% ${result.length}/${doneCount}\nExcpected wait time: ${msToTime(startTime.getTime() + new Date().getTime())}`);
            };
        }
    }

    async get_rooms_sprites() {
        //Get rooms sprites from API.

        const params = {
            'version': this.api_settings['RoomDesignSpriteVersion']
        }

        // retrieve data as XML from Pixel Starships API
        const endpoint = `https://${this.server}/RoomDesignSpriteService/ListRoomDesignSprites`;
        const response = await this.call(endpoint, params);

        var rooms_sprites = [];

        if (this.DEBUG)
            fs.writeFileSync(`./rooms.json`, JSON.stringify(response));

        response.RoomDesignSpriteService.ListRoomDesignSprites[0].RoomDesignSprites[0].RoomDesignSprite.forEach(x => {
            rooms_sprites.push(x.$);
        });

        return rooms_sprites;
    }

    async get_ships() {
        //Get ships designs from API.

        const params = {
            'version': this.api_settings['ShipDesignVersion'],
            'languageKey': 'en'
        }

        // retrieve data as XML from Pixel Starships API
        const endpoint = `https://${this.server}/ShipService/ListAllShipDesigns2`;
        const response = await this.call(endpoint, params)

        var ships = [];
        if (this.api_settings.ShipDesignVersion != response.ShipService.ListShipDesigns[0].$.version)
            this.loadCache();
        else
            response.ShipService.ListShipDesigns[0].ShipDesigns[0].ShipDesign.forEach(x => {
                ships.push(new module.exports.shipModel(x.$));
            });

        return ships;
    }

    async get_researches() {
        //Get research designs from API.

        const params = {
            'version': this.api_settings['ResearchDesignVersion'],
            'languageKey': 'en'
        }

        // retrieve data as XML from Pixel Starships API
        const endpoint = `https://${this.server}/ResearchService/ListAllResearchDesigns2`;
        const response = await this.call(endpoint, params)

        var researches = [];

        response.ResearchService.ListAllResearchDesigns[0].ResearchDesigns.forEach(x => {
            x.ResearchDesign.forEach(y => researches.push(y.$));
        });

        return researches
    }

    async get_rooms() {
        //Get room designs from API.

        // get room purchase
        var rooms_purchase = await this.get_rooms_purchase();

        const params = {
            'version': this.api_settings['RoomDesignSpriteVersion'],
            'languageKey': 'en'
        }

        // retrieve data as XML from Pixel Starships API
        const endpoint = `https://${this.server}/RoomService/ListRoomDesigns2`;
        const response = await this.call(endpoint, params);

        var rooms = [];
        var Rooms = [];
        response.RoomService.ListRoomDesigns[0].RoomDesigns.forEach(x => {
            x.RoomDesign.forEach(y => Rooms.push(y.$));
        });

        Rooms.forEach(room_node => {
            // if room purchase, add node to room node
            var room_purchase = rooms_purchase.find(room_purchase => room_purchase['RoomDesignId'] == room_node['RootRoomDesignId']);

            if (room_purchase)
                room_node['AvailabilityMask'] = room_purchase['AvailabilityMask'];

            rooms.push(room_node)
        });

        return rooms
    }

    async get_rooms_purchase() {
        //Get room designs from API.

        const params = {
            'version': this.api_settings['RoomDesignPurchaseVersion'],
            'languageKey': 'en'
        }

        // retrieve data as XML from Pixel Starships API
        const endpoint = `https://${this.server}/RoomService/ListRoomDesignPurchase`;
        const response = await this.call(endpoint, params)

        var rooms_purchase = [];

        response.RoomService.ListRoomDesignPurchase[0].RoomDesignPurchases[0].RoomDesignPurchase.forEach(x => rooms_purchase.push(x.$));

        return rooms_purchase;
    }

    async get_characters() {
        //Get character designs from API.

        const params = {
            'version': this.api_settings['CharacterDesignVersion'],
            'languageKey': 'en'
        }

        // retrieve data as XML from Pixel Starships API
        const endpoint = `https://${this.server}/CharacterService/ListAllCharacterDesigns2`;
        const response = await this.call(endpoint, params)

        var characters = []
        response.CharacterService.ListAllCharacterDesigns[0].CharacterDesigns[0].CharacterDesign.forEach(x => characters.push(new characterModel(x.$)));

        characters = characters;
        return characters;
    }

    async get_collections() {
        //Get collection designs from API.

        const params = {
            'version': this.api_settings['CollectionDesignVersion'],
            'languageKey': 'en'
        }

        // retrieve data as XML from Pixel Starships API
        const endpoint = `https://${this.server}/CollectionService/ListAllCollectionDesigns`;
        const response = await this.call(endpoint, params);

        collections = []
        response.CollectionService.ListAllCollectionDesigns[0].CollectionDesigns[0].CollectionDesign.forEach(x => collections.push(x.$));

        return collections
    }

    async get_items() {
        //Get item designs from API.

        const params = {
            'version': this.api_settings['ItemDesignVersion'],
            'languageKey': 'en'
        }

        // retrieve data as XML from Pixel Starships API
        const endpoint = `https://${this.server}/ItemService/ListItemDesigns2`;
        const response = await this.call(endpoint, params);

        var items = []
        response.ItemService.ListItemDesigns[0].ItemDesigns[0].ItemDesign.forEach(x => items.push(new module.exports.itemModel(x.$)));

        items = items;
        return items;
    }

    async get_alliances(take = 100) {
        //Get alliances from API, top 100 by default.

        const params = {
            'version': this.api_settings['ItemDesignVersion'],
            'take': take
        }

        // retrieve data as XML from Pixel Starships API
        const endpoint = `https://${this.server}/AllianceService/ListAlliancesByRanking`;
        const response = await this.call(endpoint, params);

        var alliances = [];

        const self = this;
        response.AllianceService.ListAlliancesByRanking[0].Alliances[0].Alliance.forEach(x => alliances.push(new allianceModel(x.$, this)));

        return alliances;
    }

    async get_sales(item_id, max_sale_id = 0, take = null) {
        //Download sales for given item from PSS API.

        var sales = [];

        // offset, API returns sales only by 20 by 20
        var start = 0;
        var end = 20;

        var count = 0;
        var max_sale_id_reached = false;
        var sale_id = null;
        while (sale_id != max_sale_id) {

            const params = {
                'itemDesignId': item_id,
                'saleStatus': 'Sold',
                'from': start,
                'to': end
            }

            // retrieve data as XML from Pixel Starships API
            const endpoint = `https://${this.server}/MarketService/ListSalesByItemDesignId`;
            const response = await this.call(endpoint, params);
            var sale_nodes = response.MarketService.ListSalesByItemDesignId[0].Sales;

            // no more sales available
            if (sale_nodes.length == 1)
                return;

            sale_nodes.forEach(sale_node => {
                sale_id = parseInt(sale_node['SaleId']);
                var sale = sale_node;

                if (sale_id > max_sale_id)
                    sales.push(sale);
                else
                    max_sale_id_reached = true;

                count += 1
                if (take || take == count) {
                    max_sale_id_reached = true;
                    return;
                }

                if (max_sale_id_reached)
                    return;
            });

            // next page
            start += 20
            end += 20
        }

        return sales;
    }

    /**
     * Get users from API, top 100 by default.
     * @param {number} start 
     * @param {number} end
     */
    async get_users(start = 1, end = 100) {

        const params = {
            'from': start,
            'to': end
        }

        // retrieve data as XML from Pixel Starships API
        const endpoint = `https://${this.server}/LadderService/ListUsersByRanking`
        const response = await this.call(endpoint, params, true)
        this.log(JSON.stringify(response));
        this.log(response);

        var users = [];

        return users;
    }

    async get_prestiges_character_to(character_id) {
        //Get prestiges recipe creating given character from API.

        const params = {
            'characterDesignId': character_id
        }

        // retrieve data as XML from Pixel Starships API
        const endpoint = `https://${this.server}/CharacterService/PrestigeCharacterTo`;
        const response = await this.call(endpoint, params)
        root = ElementTree.fromstring(response.text)

        prestiges = []
        prestige_nodes = root.find('.//Prestiges')

        // it's possible to don't have prestiges for the given character
        if (prestige_nodes)
            prestige_nodes.forEach(prestige_node => {
                prestige = parse_prestige_node(prestige_node)
                prestige['pixyship_xml_element'] = prestige_node  // custom field, return raw XML data too
                prestiges.append(prestige)
            });

        return prestiges
    }

    async get_prestiges_character_from(character_id) {
        //Get prestiges recipe created with given character from API.//

        const params = {
            'characterDesignId': character_id
        }

        // retrieve data as XML from Pixel Starships API
        const endpoint = `https://${this.server}/CharacterService/PrestigeCharacterFrom`;
        const response = await this.call(endpoint, params);
        this.log(response);

        prestiges = []

        // it's possible to don't have prestiges for the given character
        if (prestige_nodes)
            prestige_nodes.forEach(prestige_node => {
                prestige = parse_prestige_node(prestige_node)
                prestige['pixyship_xml_element'] = prestige_node  // custom field, return raw XML data too
                prestiges.append(prestige)
            });

        return prestiges
    }

    get stardate() {
        //Compute Stardate.
        const total_seconds = parseInt(Math.floor((new Date().getTime() - this.PSS_START_DATE.getTime()) / 1000));
        const total_minutes = parseInt(Math.floor(total_seconds / 60));
        const total_hours = parseInt(Math.floor(total_minutes / 60));
        const days = parseInt(Math.floor(total_hours / 24));
        return days;
    }

    /*parse_sale_item_mask(sale_item_mask){
       //"From SaleItemMask determine Sale options.//

       equipment_mask = int(sale_item_mask)
       output = [int(x) for x in '{:05b}'.format(equipment_mask)]
       options = [IAP_OPTIONS_MASK_LOOKUP[4 - i] for i, b in enumerate(output) if b]

       // reverse order
       options.reverse()

       return options
    }*/
    /**
     * 
     * @param {string} email 
     * @param {string} password 
     * @returns 
     */
    async login0(email, password) {
        return new Promise(async (r) => {
            const browser = await puppeteer.launch();
            const page = await browser.newPage();
            page.on('response', async response => {
                const status = response.status();
                if ((status >= 300) && (status <= 399)) {
                    var n = response.headers()['location'];
                    this.log('Redirect from', response.url(), 'to', n);
                    if (n == `/Account/Login`) // invalid login details
                        r(false);
                    else if (n == `/`) { // :)
                        await page.goto('https://www.pixelstarships.com/PlayerCenter/MyShip');
                        const d = await page.evaluate(() => {
                            return {
                                trophies: document.getElementsByClassName('label Trophy-value')[0],
                                minerals: document.getElementsByClassName('label Mineral-value')[0],
                                gas: document.getElementsByClassName('label Gas-value')[0],
                                starbux: document.getElementsByClassName('label Starbux-value')[0],
                                //ship: document.getElementById,
                            };
                        });
                        console.log(d);
                    }
                }
            });
            await page.goto('https://pixelstarships.com/Account/Login');
            await page.evaluate(async (e, p) => {
                document.getElementById('Email').value = e;
                document.getElementById('passwordField').value = p;
            }, email, password);
            await page.click(`[id=loginBtn]`);
        });
    }

    /**
     * 
     * @param {string} email 
     * @param {string} password 
     * @returns 
     */
    /*async login(email, password) {
        return new Promise(async (r) => {
            const browser = await puppeteer.launch();
            const page = await browser.newPage();
            page.on('response', async response => {
                const status = response.status();
                if ((status >= 300) && (status <= 399)) {
                    var n = response.headers()['location'];
                    this.log('Redirect from', response.url(), 'to', n);
                    if (n == `/Account/Login`)
                        r(false);
                    else if (n == `/`) {
                        /*await page.evaluate(async (e, p) => {
                            document.getElementById('Email').value = e;
                            document.getElementById('passwordField').value = p;
                        }, email, password);*//*
    this.log(`${await page.$(`#form`).action}\n\n${JSON.stringify({
        __RequestVerificationToken: await page.$(`[name=__RequestVerificationToken]`),//await page.cookies(`www.pixelstarships.com`).__RequestVerificationToken,
        OldPassword: password,
        NewPassword: password,
        ConfirmPassword: password,
    })}`); // await page.$(`#form`).action
    require('node-fetch')(`https://www.pixelstarships.com//Account/RemoveAccountFromSubscription`, { // 
        method: "post",
        body: new URLSearchParams({
            __RequestVerificationToken: await page.$(`[name=__RequestVerificationToken]`),
            OldPassword: password,
            NewPassword: password,
            ConfirmPassword: password,
        }), // { OldPassword, NewPassword, ConfirmPassword }
    }).then(async x => {
        this.log(await x)
        this.log(await x.text());
        this.log(await x.json())
    });
    //await page.goto(`https://www.pixelstarships.com/PlayerCenter/MyShip`);
}
}
});
await page.goto('https://pixelstarships.com/Account/Login');
await page.evaluate(async (e, p) => {
document.getElementById('Email').value = e;
document.getElementById('passwordField').value = p;
}, email, password);
await page.click(`[id=loginBtn]`);
});
}*/


    /*<script>
    $(document).ready(function () {
        $("#msgContainer").hide();
        this.log($('#table tr').length);
        //if ($('#table tr').length <= 2) {
        //    $("#removeSubBtn").hide();
        //}
    });

    $("#addSubBtn").click(function () {
        changeFormAction('https://www.pixelstarships.com//Account/AddAccountToSubscription');
        handleActionBtn('add');
    });

    $("#removeSubBtn").click(function () {
        changeFormAction('https://www.pixelstarships.com//Account/RemoveAccountFromSubscription');
        handleActionBtn('remove');
    });



    function changeFormAction(link) {
        $("#form").attr("action", link);
    }

    function handleActionBtn(actionType) {
        var buttonAction = capitaliseString(actionType);
        var messageForNote = actionType === 'add' ? 'Note: You can only have a maximum of 5 subscriptions in a subscription group' :
            `Note: If you remove the account you're currently logged in with, you'll no longer be able to see yourself or others in this subscription group.`;

        //show the form to submit new sub
        var title = `<div style="margin-bottom:15px; color: white;"><div class="row"><div class="col text-center"><h3 style='font-family:bitFont'>Please enter the username and password of the account you want to ${actionType}</h3>`;
        var note = `<h5 style='font-family: bitFont'>${messageForNote}</h5></div></div></div>`;
        var emailLabel = "<div class='form-group'> <label for='email' class='control-label col-sm-2'>Email</label>";
        var emailInput = "<div class='col-sm-9'><input type='email' class='form-control' id='email' name='email' autocomplete='off' required></div></div>";
        var passwordLabel = "<div class='form-group'><label for='password' class='control-label col-sm-2'>Password</label>";
        var passwordInput = "<div class='col-sm-9'><input type='password' class='form-control' id='password' name='password' autocomplete='off' required></div></div>";
        var buttonPrep = "<div style='padding-bottom:10px'><div class='row'><div class='col text-center'>";
        var submitButton = `<button class='btn btn-primary' type='submit' id='submitBtn' style='margin: 10px'  data-loading-text="<i class='fa fa-spinner fa-spin '></i> Loading">${buttonAction}</button>`;
        var cancelButton = "<button class='btn btn-danger' type='button' id='cancelBtn' style='margin: 10px'>Cancel</button></div></div></div>";
        var section = title + note + emailLabel + emailInput + passwordLabel + passwordInput + buttonPrep + submitButton + cancelButton;
        $("#newSubs").html(section);
        $("#newSubs").show();
        $("#form").show();

        //hide the components we don't need
        $("#result").hide();
        $("#addSubBtn").hide();
        $("#removeSubBtn").hide();

    }

    function capitaliseString(action) {
        return action.charAt(0).toUpperCase() + action.slice(1);
    }

    //have to use .on instead of click because of dynamic objects being created
    $(document).on('click', '#cancelBtn', function (e) {
        e.preventDefault();
        $("#email").html("");
        $("#serverMessage").html("");
        $("#msgContainer").hide();
        $("#newSubs").hide();
        $("#form").hide();
        $("#addSubBtn").show();
        $("#removeSubBtn").show();
    })

    $("#form").submit(function (e) {
        e.preventDefault();
        var actionurl = e.currentTarget.action;

        //clear any error messages that might already be present
        $("#serverMessage").html("");
        $("#msgContainer").hide();

        //make spinner loading appear
        var btn = $(this).find("button:first");
        btn.button('loading');


        function handleSubRemoval(data) {
            if (data.includes("Successfully removed")) {
                location.reload();

                //display the result
                //$(".panel-collapse").collapse("show");
                //$("#SubscriptionBody").collapse("show");


            } else {
                
                var startIndexOfMsg = 22;
                $("#msgContainer").show();
                $("#serverMessage").html(data.slice(startIndexOfMsg));
                btn.button('reset');
            }
        }

        function handleSubAddition(data) {
            try {
                var user = JSON.parse(data);
                //append it to the table
                var name = `<tr><td>${user.Name}</td>`;
                var email = `<td>${user.Email}</td>`;
                var lastLoginDate = `<td>${user.LastLoginDate}</td>`;
                var vipExpiryDate = `<td>${user.VipExpiryDate}</td>`;

                var row = name + email + lastLoginDate + vipExpiryDate;
                $("#subInfo").append(row);

                //display the result
                $("#result").show();
                $("#result").html(`Successfully added a subscription to the account with email: ${user.Email}`);

                //only show the add account button again if at the most we have 5 rows(4 subs, 1 heading row) as max subs is 5
                //don't show the remove button if at the most we have 2 rows (1 sub, 1 heading row) as we can't remove if there's only 1
                if ($('#table tr').length <= 2) {
                    $("#addSubBtn").show();
                    $("#removeSubBtn").hide();
                } else if ($('#table tr').length <= 5) {
                    $("#addSubBtn").show();
                    $("#removeSubBtn").show();
                } else {
                    $("#addSubBtn").hide();
                    $("#removeSubBtn").show();
                }

                //clear the email field and hide this section
                $("#email").html("");
                $("#newSubs").hide();
                btn.button('reset');

            } catch (e) {
                //display any server messages or errors
                $("#msgContainer").show();
                $("#serverMessage").html(data);
                btn.button('reset');

            }
        }

        //execute recaptacha before sending data to server
        grecaptcha.execute('6LeFgYgUAAAAAJ2UoYPitEnW9hUaTlCFTQbFMUVL', { action: 'subManagement' })
        .then(function (token) {
            $("#subToken").val(token);
            $.post(actionurl, $("#form").serialize(), function (data) {
                //if a user has been removed, we're going to refresh the whole page to see the changes in the table
                if (data.startsWith("Subscription Removal - ")) {
                    handleSubRemoval(data);
                } else {
                    handleSubAddition(data);
                }

            })
        });



    });

    </script>*/
}