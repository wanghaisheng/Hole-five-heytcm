document.addEventListener('DOMContentLoaded', () => {
    const WUXING = {
        METAL: { id: 'METAL', name: '金', color: 'var(--color-metal)', icon: 'icon_metal.png', generates: 'WATER', overcomes: 'WOOD', personImg: 'person_metal.png', holeTexture: 'hole_texture_metal.png' },
        WOOD:  { id: 'WOOD',  name: '木', color: 'var(--color-wood)',  icon: 'icon_wood.png',  generates: 'FIRE',  overcomes: 'EARTH', personImg: 'person_wood.png', holeTexture: 'hole_texture_wood.png' },
        WATER: { id: 'WATER', name: '水', color: 'var(--color-water)', icon: 'icon_water.png', generates: 'WOOD',  overcomes: 'FIRE', personImg: 'person_water.png', holeTexture: 'hole_texture_water.png' },
        FIRE:  { id: 'FIRE',  name: '火', color: 'var(--color-fire)',  icon: 'icon_fire.png',  generates: 'EARTH', overcomes: 'METAL', personImg: 'person_fire.png', holeTexture: 'hole_texture_fire.png' },
        EARTH: { id: 'EARTH', name: '土', color: 'var(--color-earth)', icon: 'icon_earth.png', generates: 'METAL', overcomes: 'WATER', personImg: 'person_earth.png', holeTexture: 'hole_texture_earth.png' },
        MYSTERY: { id: 'MYSTERY', name: '?', color: 'var(--color-mystery)', icon: 'icon_question.png', personImg: 'person_mystery.png'}
    };

    const OBSTACLE_TYPES = {
        WOOD_OBSTACLE: { id: 'WOOD_OBSTACLE', name: '枯木', element: 'WOOD', clearedBy: 'METAL', img: 'obstacle_wood_raw.png' },
        METAL_OBSTACLE: { id: 'METAL_OBSTACLE', name: '金属矿石', element: 'METAL', clearedBy: 'FIRE', img: 'obstacle_metal_ore.png' },
        WATER_OBSTACLE: { id: 'WATER_OBSTACLE', name: '冰墙', element: 'WATER', clearedBy: 'FIRE', img: 'obstacle_ice_wall.png' }, 
        FIRE_OBSTACLE: { id: 'FIRE_OBSTACLE', name: '烈焰', element: 'FIRE', clearedBy: 'WATER', img: 'obstacle_fire_blaze.png' },
        EARTH_OBSTACLE: { id: 'EARTH_OBSTACLE', name: '巨石', element: 'EARTH', clearedBy: 'WOOD', img: 'obstacle_earth_boulder.png' }
    };

    const gameBoard = document.getElementById('game-board');
    const sourceBay = document.getElementById('source-bay');
    const collectionBay = document.getElementById('collection-bay');
    const ufoContainer = document.getElementById('ufo-container');
    const ufoElement = document.getElementById('ufo');
    const tempMessageEl = document.getElementById('temp-message');
    const resetLevelButton = document.getElementById('reset-level-button');
    const backToMenuButton = document.getElementById('back-to-menu-button');
    const levelCompleteMessageEl = document.getElementById('level-complete-message');
    const nextLevelButton = document.getElementById('next-level-button');

    let audioContext;
    const soundBuffers = {};

    async function loadSound(name, url) {
        if (!audioContext) {
            try {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
            } catch (e) {
                console.warn("Web Audio API is not supported in this browser");
                return;
            }
        }
        if (!audioContext) return; 

        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            audioContext.decodeAudioData(arrayBuffer, (buffer) => {
                soundBuffers[name] = buffer;
            }, (error) => console.error(`Error decoding audio data for ${name}:`, error));
        } catch (error) {
            console.error(`Error loading sound ${name}:`, error);
        }
    }

    function playSound(name) {
        if (audioContext && soundBuffers[name]) {
            const source = audioContext.createBufferSource();
            source.buffer = soundBuffers[name];
            source.connect(audioContext.destination);
            source.start(0);
        }
    }

    loadSound('drop', 'sfx_drop_person.mp3');
    loadSound('collect', 'sfx_ufo_collect.mp3');
    loadSound('clear_obstacle', 'sfx_obstacle_clear.mp3');
    loadSound('wuxing_effect', 'sfx_wuxing_effect.mp3');

    let gameState = {
        level: 0,
        draggingGroup: null,
        people: [],
        sourceHoles: [],
        targetHoles: [],
        obstacles: [],
        tunnels: [], 
        collectionGoals: {},
        collectedCounts: {},
        isLevelComplete: false,
    };

    const levels = [
        // Level 1: 初识水行 (Introduction to Water) - Index 0
        {
            sourceHoles: [
                { element: 'WATER', initialPeople: 16, maxPeople: 20, regenerationRate: 3000 }
            ],
            targetHoles: [
                { element: 'WATER', capacity: 16, x: '50%', y: '30%' }
            ],
            obstacles: [],
            collectionGoals: { WATER: 16 }
        },
        // Level 2: 木行登场，双色管理 (Wood Appears, Dual Color Management) - Index 1
        {
            sourceHoles: [
                { element: 'WATER', initialPeople: 16, maxPeople: 20, regenerationRate: 3000 },
                { element: 'WOOD', initialPeople: 16, maxPeople: 20, regenerationRate: 3000 }
            ],
            targetHoles: [
                { element: 'WATER', capacity: 16, x: '30%', y: '30%' },
                { element: 'WOOD', capacity: 16, x: '70%', y: '30%' }
            ],
            obstacles: [],
            collectionGoals: { WATER: 16, WOOD: 16 }
        },
        // Level 3: 容量变化与收集槽 (Capacity Change & Collection Bay) - Index 2
        {
            sourceHoles: [
                { element: 'WATER', initialPeople: 8, maxPeople: 12, regenerationRate: 3000 },
                { element: 'WOOD', initialPeople: 24, maxPeople: 30, regenerationRate: 3000 }
            ],
            targetHoles: [
                { element: 'WATER', capacity: 8, x: '30%', y: '30%' },
                { element: 'WOOD', capacity: 24, x: '70%', y: '30%' }
            ],
            obstacles: [],
            collectionGoals: { WATER: 8, WOOD: 24 }
        },
        // Level 4: 初遇土行，三色挑战 (Earth Introduction, Triple Color Challenge) - Index 3
        {
            sourceHoles: [
                { element: 'WATER', initialPeople: 16, maxPeople: 20, regenerationRate: 3000 },
                { element: 'WOOD', initialPeople: 16, maxPeople: 20, regenerationRate: 3000 },
                { element: 'EARTH', initialPeople: 16, maxPeople: 20, regenerationRate: 3000 }
            ],
            targetHoles: [
                { element: 'WATER', capacity: 16, x: '25%', y: '30%' },
                { element: 'WOOD', capacity: 16, x: '50%', y: '30%' },
                { element: 'EARTH', capacity: 16, x: '75%', y: '30%' }
            ],
            obstacles: [],
            collectionGoals: { WATER: 16, WOOD: 16, EARTH: 16 }
        },
        // Level 5: 相生初体验 - 水生木 (First Generation: Water generates Wood) - Index 4
        {
            sourceHoles: [
                { element: 'WATER', initialPeople: 10, maxPeople: 15, regenerationRate: 3000 },
                { element: 'WOOD', initialPeople: 8, maxPeople: 20, regenerationRate: 3000 } 
            ],
            targetHoles: [
                { 
                    element: 'WOOD', capacity: 16, x: '30%', y: '30%', 
                    generationInput: { sourceElement: 'WATER', effectType: 'SPAWN_AT_SOURCE', targetSourceElement: 'WOOD', amount: 2 } 
                },
                { element: 'WATER', capacity: 10, x: '70%', y: '30%' }
            ],
            obstacles: [],
            collectionGoals: { WOOD: 16, WATER: 10 }
        },
        // Level 6: 金行来访，四色 पजल (Metal Arrives, Four Color Puzzle) - Index 5
        {
            sourceHoles: [
                { element: 'WATER', initialPeople: 10, maxPeople: 15, regenerationRate: 3000 },
                { element: 'WOOD', initialPeople: 10, maxPeople: 15, regenerationRate: 3000 },
                { element: 'EARTH', initialPeople: 10, maxPeople: 15, regenerationRate: 3000 },
                { element: 'METAL', initialPeople: 10, maxPeople: 15, regenerationRate: 3000 }
            ],
            targetHoles: [
                { element: 'WATER', capacity: 10, x: '20%', y: '30%' },
                { element: 'WOOD', capacity: 10, x: '40%', y: '30%' },
                { element: 'EARTH', capacity: 10, x: '60%', y: '30%' },
                { element: 'METAL', capacity: 10, x: '80%', y: '30%' }
            ],
            obstacles: [],
            collectionGoals: { WATER: 10, WOOD: 10, EARTH: 10, METAL: 10 }
        },
        // Level 7: 初级障碍物 - 木箱 (Basic Obstacle - Wooden Box) - Index 6
        { 
            sourceHoles: [
                { element: 'WATER', initialPeople: 10, maxPeople: 15, regenerationRate: 3000 },
                { element: 'WOOD', initialPeople: 10, maxPeople: 15, regenerationRate: 3000 },
                { element: 'METAL', initialPeople: 10, maxPeople: 15, regenerationRate: 3000 } 
            ],
            targetHoles: [
                { element: 'WATER', capacity: 10, x: '30%', y: '60%' },
                { element: 'WOOD', capacity: 10, x: '70%', y: '60%' },
                { element: 'METAL', capacity: 10, x: '50%', y: '20%' }
            ],
            obstacles: [
                { type: 'WOOD_OBSTACLE', x: '50%', y: '40%' } 
            ],
            collectionGoals: { WATER: 10, WOOD: 10, METAL: 10 }
        },
        // Level 8: 火行降临，五行齐聚 (Fire Descends, Five Elements Gather) - Index 7
        {
            sourceHoles: [
                { element: 'WATER', initialPeople: 8, maxPeople: 12, regenerationRate: 3000 },
                { element: 'WOOD', initialPeople: 8, maxPeople: 12, regenerationRate: 3000 },
                { element: 'EARTH', initialPeople: 8, maxPeople: 12, regenerationRate: 3000 },
                { element: 'METAL', initialPeople: 8, maxPeople: 12, regenerationRate: 3000 },
                { element: 'FIRE', initialPeople: 8, maxPeople: 12, regenerationRate: 3000 }
            ],
            targetHoles: [
                { element: 'WATER', capacity: 8, x: '15%', y: '30%' },
                { element: 'WOOD', capacity: 8, x: '35%', y: '30%' },
                { element: 'EARTH', capacity: 8, x: '50%', y: '70%' }, 
                { element: 'METAL', capacity: 8, x: '65%', y: '30%' },
                { element: 'FIRE', capacity: 8, x: '85%', y: '30%' }
            ],
            obstacles: [],
            collectionGoals: { WATER: 8, WOOD: 8, EARTH: 8, METAL: 8, FIRE: 8 }
        },
        // Level 9: 相生再体验 - 木生火 (Generation Again - Wood generates Fire) - Index 8
        {
            sourceHoles: [
                { element: 'WOOD', initialPeople: 10, maxPeople: 15, regenerationRate: 3000 },
                { element: 'FIRE', initialPeople: 5, maxPeople: 10, regenerationRate: 3000 } 
            ],
            targetHoles: [
                { element: 'WOOD', capacity: 10, x: '30%', y: '30%' },
                { 
                    element: 'FIRE', capacity: 10, x: '70%', y: '30%', 
                    generationInput: { sourceElement: 'WOOD', effectType: 'SPAWN_NEAR_HOLE', spawnElement: 'FIRE', amount: 1 } 
                }
            ],
            obstacles: [],
            collectionGoals: { WOOD: 10, FIRE: 10 }
        },
        // Level 10: 五行障碍初现 - 烈焰 (火) (Wuxing Obstacle - Blaze (Fire), cleared by Water) - Index 9
        {
            sourceHoles: [
                { element: 'WATER', initialPeople: 10, maxPeople: 15, regenerationRate: 3000 },
                { element: 'FIRE', initialPeople: 10, maxPeople: 15, regenerationRate: 3000 }
            ],
            targetHoles: [
                { element: 'WATER', capacity: 10, x: '30%', y: '30%' },
                { element: 'FIRE', capacity: 10, x: '70%', y: '60%' }
            ],
            obstacles: [
                { type: 'FIRE_OBSTACLE', x: '50%', y: '45%' } 
            ],
            collectionGoals: { WATER: 10, FIRE: 10 }
        },
        // Level 11: 隧道初体验 (Tunnel Introduction) - Index 10
        {
            sourceHoles: [
                { element: 'WATER', initialPeople: 10, maxPeople: 15, regenerationRate: 3000 },
                { element: 'WOOD', initialPeople: 10, maxPeople: 15, regenerationRate: 3000 }
            ],
            targetHoles: [
                { element: 'WATER', capacity: 10, x: '75%', y: '25%' }, // Needs to go through tunnel
                { element: 'WOOD', capacity: 10, x: '75%', y: '75%' }
            ],
            obstacles: [],
            tunnels: [
                { id: 'T1', entryX: '25%', entryY: '25%', exitX: '60%', exitY: '25%' }
            ],
            collectionGoals: { WATER: 10, WOOD: 10 },
            tutorial: "新的隧道出现了！小人会从另一个出口出来。"
        },
        // Level 12: 相生之连锁 - 火生土 (Generation: Fire generates Earth) - Index 11
        {
            sourceHoles: [
                { element: 'FIRE', initialPeople: 10, maxPeople: 15, regenerationRate: 3000 },
                { element: 'EARTH', initialPeople: 5, maxPeople: 15, regenerationRate: 3000 },
                { element: 'WOOD', initialPeople: 5, maxPeople: 10, regenerationRate: 4000 } // Auxiliary
            ],
            targetHoles: [
                { element: 'FIRE', capacity: 10, x: '25%', y: '50%' },
                { 
                    element: 'EARTH', capacity: 10, x: '75%', y: '50%',
                    generationInput: { sourceElement: 'FIRE', effectType: 'SPAWN_NEAR_HOLE', spawnElement: 'EARTH', amount: 2 }
                },
                { element: 'WOOD', capacity: 5, x: '50%', y: '20%' }
            ],
            obstacles: [],
            collectionGoals: { FIRE: 10, EARTH: 10, WOOD: 5 },
            tutorial: "火能生土！让大地更丰饶！"
        },
        // Level 13: 五行障碍 - 巨石 (土) (Obstacle: Earth Boulder) - Index 12
        {
            sourceHoles: [
                { element: 'WOOD', initialPeople: 15, maxPeople: 20, regenerationRate: 3000 },
                { element: 'EARTH', initialPeople: 10, maxPeople: 15, regenerationRate: 3000 }
            ],
            targetHoles: [
                { element: 'WOOD', capacity: 15, x: '25%', y: '30%' },
                { element: 'EARTH', capacity: 10, x: '75%', y: '70%' } 
            ],
            obstacles: [
                { type: 'EARTH_OBSTACLE', x: '50%', y: '50%' }
            ],
            collectionGoals: { WOOD: 15, EARTH: 10 },
            tutorial: "木能克土！用绿色木小人清除巨石！"
        },
        // Level 14: 双隧道与颜色规划 (Dual Tunnels & Color Planning) - Index 13
        {
            sourceHoles: [
                { element: 'WATER', initialPeople: 8, maxPeople: 12, regenerationRate: 3000 },
                { element: 'WOOD', initialPeople: 8, maxPeople: 12, regenerationRate: 3000 },
                { element: 'EARTH', initialPeople: 8, maxPeople: 12, regenerationRate: 3000 }
            ],
            targetHoles: [
                { element: 'WATER', capacity: 8, x: '80%', y: '20%' }, 
                { element: 'WOOD', capacity: 8, x: '80%', y: '80%' }, 
                { element: 'EARTH', capacity: 8, x: '50%', y: '50%' }  
            ],
            tunnels: [
                { id: 'TA', entryX: '20%', entryY: '20%', exitX: '60%', exitY: '20%' }, 
                { id: 'TB', entryX: '20%', entryY: '80%', exitX: '60%', exitY: '80%' }  
            ],
            collectionGoals: { WATER: 8, WOOD: 8, EARTH: 8 },
            tutorial: "规划你的小人通过正确的隧道！"
        },
        // Level 15: 神秘小人增多 (More Mystery People) - Index 14
        {
            sourceHoles: [
                { element: 'METAL', initialPeople: 10, maxPeople: 15, regenerationRate: 3000 },
                { element: 'FIRE', initialPeople: 10, maxPeople: 15, regenerationRate: 3000 },
                { element: 'MYSTERY', initialPeople: 12, maxPeople: 20, regenerationRate: 2500 }
            ],
            targetHoles: [
                { element: 'METAL', capacity: 16, x: '30%', y: '30%' },
                { element: 'FIRE', capacity: 16, x: '70%', y: '30%' }
            ],
            collectionGoals: { METAL: 16, FIRE: 16 },
            tutorial: "好多神秘小人！先试着把它们放入洞穴看看会变成什么颜色。"
        },
        // Level 16: 相生之源泉 - 金生水 (Generation: Metal generates Water) - Index 15
        {
            sourceHoles: [
                { element: 'METAL', initialPeople: 10, maxPeople: 15, regenerationRate: 3000 },
                { element: 'WATER', initialPeople: 8, maxPeople: 15, regenerationRate: 3000 },
                { element: 'EARTH', initialPeople: 5, maxPeople: 10, regenerationRate: 4000 } // Auxiliary
            ],
            targetHoles: [
                { element: 'METAL', capacity: 10, x: '30%', y: '30%' },
                { 
                    element: 'WATER', capacity: 15, x: '70%', y: '30%',
                    generationInput: { sourceElement: 'METAL', effectType: 'SOURCE_REGEN_BOOST', targetSourceElement: 'WATER', multiplier: 0.5, duration: 20000 }
                },
                { element: 'EARTH', capacity: 5, x: '50%', y: '70%' }
            ],
            collectionGoals: { METAL: 10, WATER: 15, EARTH: 5 },
            tutorial: "金能生水！源源不断！"
        },
        // Level 17: 五行障碍 - 金属矿石 (金) (Obstacle: Metal Ore) - Index 16
        {
            sourceHoles: [
                { element: 'FIRE', initialPeople: 15, maxPeople: 20, regenerationRate: 3000 },
                { element: 'METAL', initialPeople: 10, maxPeople: 15, regenerationRate: 3000 }
            ],
            targetHoles: [
                { element: 'FIRE', capacity: 15, x: '25%', y: '70%' },
                { element: 'METAL', capacity: 10, x: '75%', y: '30%' } 
            ],
            obstacles: [
                { type: 'METAL_OBSTACLE', x: '50%', y: '50%' }
            ],
            collectionGoals: { FIRE: 15, METAL: 10 },
            tutorial: "火能克金！用红色火小人熔化金属！"
        },
        // Level 18: 多重障碍与路径选择 (Multiple Obstacles & Path Choice) - Index 17
        {
            sourceHoles: [ // Using current script's more playable source setup
                { element: 'WATER', initialPeople: 10, maxPeople: 15, regenerationRate: 3000 },
                { element: 'METAL', initialPeople: 10, maxPeople: 15, regenerationRate: 3000 }, 
                { element: 'FIRE', initialPeople: 10, maxPeople: 15, regenerationRate: 3000 }
            ],
            targetHoles: [
                { element: 'WATER', capacity: 10, x: '20%', y: '70%' }, 
                { element: 'METAL', capacity: 10, x: '50%', y: '20%' }, 
                { element: 'FIRE', capacity: 10, x: '80%', y: '70%' }  
            ],
            obstacles: [
                { type: 'FIRE_OBSTACLE', x: '20%', y: '40%' }, 
                { type: 'WOOD_OBSTACLE', x: '80%', y: '40%' } 
            ],
            collectionGoals: { WATER: 10, METAL: 10, FIRE: 10 },
            tutorial: "清除障碍，选择正确的路径！"
        },
        // Level 19: 隧道属性转换 (Tunnel Element Transformation) - Index 18
        {
            sourceHoles: [
                { element: 'WOOD', initialPeople: 20, maxPeople: 25, regenerationRate: 2500 }
            ],
            targetHoles: [
                { element: 'WOOD', capacity: 10, x: '25%', y: '25%' },
                { element: 'FIRE', capacity: 10, x: '75%', y: '75%' } 
            ],
            tunnels: [
                { id: 'T_FIRE', entryX: '25%', entryY: '75%', exitX: '60%', exitY: '75%', transformTo: 'FIRE' }
            ],
            collectionGoals: { WOOD: 10, FIRE: 10 },
            tutorial: "这个隧道能改变小人的属性！"
        },
        // Level 20: 小Boss关/阶段总结关 - 五行阵 (Mini-Boss: Wuxing Formation) - Index 19
        {
            sourceHoles: [
                { element: 'WATER', initialPeople: 10, maxPeople: 15, regenerationRate: 3000 },
                { element: 'WOOD', initialPeople: 10, maxPeople: 15, regenerationRate: 3000 },
                { element: 'FIRE', initialPeople: 10, maxPeople: 15, regenerationRate: 3000 },
                { element: 'EARTH', initialPeople: 10, maxPeople: 15, regenerationRate: 3000 },
                { element: 'METAL', initialPeople: 10, maxPeople: 15, regenerationRate: 3000 }
            ],
            targetHoles: [
                { element: 'WATER', capacity: 10, x: '50%', y: '15%' }, 
                { element: 'WOOD', capacity: 10, x: '80%', y: '35%' }, 
                { element: 'FIRE', capacity: 10, x: '70%', y: '75%' }, 
                { element: 'EARTH', capacity: 10, x: '30%', y: '75%' },
                { element: 'METAL', capacity: 10, x: '20%', y: '35%' } 
            ],
            obstacles: [ 
                 { type: 'EARTH_OBSTACLE', x: '50%', y: '50%', clearedBy: 'WOOD'}
            ],
            collectionGoals: { WATER: 10, WOOD: 10, FIRE: 10, EARTH: 10, METAL: 10 },
            tutorial: "五行大阵！清除中央巨石，让五行归位！"
        },
        // Level 21: 相生之源泉 - 金生水 (Generation: Metal generates Water) - Index 20
        {
            sourceHoles: [
                { element: 'METAL', initialPeople: 10, maxPeople: 15, regenerationRate: 3000 },
                { element: 'WATER', initialPeople: 8, maxPeople: 15, regenerationRate: 3000 },
                { element: 'EARTH', initialPeople: 5, maxPeople: 10, regenerationRate: 4000 } // Auxiliary
            ],
            targetHoles: [
                { element: 'METAL', capacity: 10, x: '30%', y: '30%' },
                { 
                    element: 'WATER', capacity: 15, x: '70%', y: '30%',
                    generationInput: { sourceElement: 'METAL', effectType: 'SOURCE_REGEN_BOOST', targetSourceElement: 'WATER', multiplier: 0.5, duration: 20000 }
                },
                { element: 'EARTH', capacity: 5, x: '50%', y: '70%' }
            ],
            collectionGoals: { METAL: 10, WATER: 15, EARTH: 5 },
            tutorial: "金能生水！源源不断！"
        },
        // Level 22: 五行障碍 - 枯木 (木) (Obstacle: Dead Wood) - Index 21
        {
            sourceHoles: [
                { element: 'METAL', initialPeople: 15, maxPeople: 20, regenerationRate: 3000 },
                { element: 'WOOD', initialPeople: 10, maxPeople: 15, regenerationRate: 3000 }
            ],
            targetHoles: [
                { element: 'METAL', capacity: 15, x: '25%', y: '70%' },
                { element: 'WOOD', capacity: 10, x: '75%', y: '30%' }
            ],
            obstacles: [
                { type: 'WOOD_OBSTACLE', x: '50%', y: '50%' } // Blocks path between
            ],
            collectionGoals: { METAL: 15, WOOD: 10 },
            tutorial: "金能克木！用金小人斩断枯木！"
        },
        // Level 23: 连锁反应 - 多重相生 (Chain Reaction - Multiple Generations) - Index 22
        {
            sourceHoles: [
                { element: 'WATER', initialPeople: 10, maxPeople: 15, regenerationRate: 3000 },
                { element: 'WOOD', initialPeople: 5, maxPeople: 15, regenerationRate: 3000 },
                { element: 'FIRE', initialPeople: 5, maxPeople: 15, regenerationRate: 3000 }
            ],
            targetHoles: [
                { element: 'WATER', capacity: 10, x: '15%', y: '50%' },
                { 
                    element: 'WOOD', capacity: 10, x: '50%', y: '25%',
                    generationInput: { sourceElement: 'WATER', effectType: 'SPAWN_AT_SOURCE', targetSourceElement: 'WOOD', amount: 2 }
                },
                { 
                    element: 'FIRE', capacity: 10, x: '50%', y: '75%',
                    generationInput: { sourceElement: 'WOOD', effectType: 'SPAWN_AT_SOURCE', targetSourceElement: 'FIRE', amount: 2 }
                }
            ],
            collectionGoals: { WATER: 10, WOOD: 10, FIRE: 10 },
            tutorial: "连锁相生! 水生木, 木生火!"
        },
        // Level 24: 快速挑战 (Speed Challenge - No actual timer) - Index 23
        {
            sourceHoles: [
                { element: 'METAL', initialPeople: 10, maxPeople: 15, regenerationRate: 2000 },
                { element: 'WOOD', initialPeople: 10, maxPeople: 15, regenerationRate: 2000 },
                { element: 'WATER', initialPeople: 10, maxPeople: 15, regenerationRate: 2000 },
                { element: 'FIRE', initialPeople: 10, maxPeople: 15, regenerationRate: 2000 }
            ],
            targetHoles: [
                { element: 'METAL', capacity: 10, x: '20%', y: '20%' },
                { element: 'WOOD', capacity: 10, x: '80%', y: '20%' },
                { element: 'WATER', capacity: 10, x: '20%', y: '80%' },
                { element: 'FIRE', capacity: 10, x: '80%', y: '80%' }
            ],
            obstacles: [ {type: 'EARTH_OBSTACLE', x: '50%', y: '50%'} ], // Central obstacle
            collectionGoals: { METAL: 10, WOOD: 10, WATER: 10, FIRE: 10 },
            tutorial: "快速思考，完成目标! (提示：土巨石可用木清除)"
        },
        // Level 25: 五行障碍 - 冰墙 (水) (Obstacle: Ice Wall - Water) - Index 24
        {
            sourceHoles: [
                { element: 'FIRE', initialPeople: 15, maxPeople: 20, regenerationRate: 3000 },
                { element: 'WATER', initialPeople: 10, maxPeople: 15, regenerationRate: 3000 }
            ],
            targetHoles: [
                { element: 'FIRE', capacity: 15, x: '25%', y: '30%' },
                { element: 'WATER', capacity: 10, x: '75%', y: '70%' }
            ],
            obstacles: [
                { type: 'WATER_OBSTACLE', x: '50%', y: '50%' }
            ],
            collectionGoals: { FIRE: 15, WATER: 10 },
            tutorial: "火能融冰！用红色火小人打破冰墙！"
        },
        // Level 26: 隧道迷阵 (Tunnel Maze) - Index 25
        {
            sourceHoles: [
                { element: 'WATER', initialPeople: 10, maxPeople: 15, regenerationRate: 3000 },
                { element: 'WOOD', initialPeople: 10, maxPeople: 15, regenerationRate: 3000 },
                { element: 'FIRE', initialPeople: 10, maxPeople: 15, regenerationRate: 3000 }
            ],
            targetHoles: [
                { element: 'WATER', capacity: 10, x: '85%', y: '15%' }, // Needs T1
                { element: 'WOOD', capacity: 10, x: '85%', y: '85%' }, // Needs T2
                { element: 'FIRE', capacity: 10, x: '50%', y: '50%' }  // Central
            ],
            tunnels: [
                { id: 'T1', entryX: '15%', entryY: '15%', exitX: '65%', exitY: '15%' },
                { id: 'T2', entryX: '15%', entryY: '85%', exitX: '65%', exitY: '85%' }
            ],
            collectionGoals: { WATER: 10, WOOD: 10, FIRE: 10 },
            tutorial: "复杂的隧道网络，小心规划！"
        },
        // Level 27: 五行克制大考验 (Wuxing Overcoming Grand Test) - Index 26
        {
            sourceHoles: [
                { element: 'WATER', initialPeople: 10, maxPeople: 15, regenerationRate: 3000 },
                { element: 'WOOD', initialPeople: 10, maxPeople: 15, regenerationRate: 3000 },
                { element: 'FIRE', initialPeople: 10, maxPeople: 15, regenerationRate: 3000 },
                { element: 'EARTH', initialPeople: 10, maxPeople: 15, regenerationRate: 3000 },
                { element: 'METAL', initialPeople: 10, maxPeople: 15, regenerationRate: 3000 }
            ],
            targetHoles: [
                { element: 'WATER', capacity: 8, x: '10%', y: '50%' }, // Path blocked by FIRE_OBSTACLE
                { element: 'WOOD', capacity: 8, x: '30%', y: '20%' },  // Path blocked by METAL_OBSTACLE
                { element: 'FIRE', capacity: 8, x: '50%', y: '80%' },   // Path blocked by WATER_OBSTACLE
                { element: 'EARTH', capacity: 8, x: '70%', y: '20%' },  // Path blocked by WOOD_OBSTACLE
                { element: 'METAL', capacity: 8, x: '90%', y: '50%' }   // Path blocked by EARTH_OBSTACLE
            ],
            obstacles: [
                { type: 'FIRE_OBSTACLE', x: '10%', y: '30%' },
                { type: 'METAL_OBSTACLE', x: '30%', y: '40%' },
                { type: 'WATER_OBSTACLE', x: '50%', y: '60%' },
                { type: 'WOOD_OBSTACLE', x: '70%', y: '40%' },
                { type: 'EARTH_OBSTACLE', x: '90%', y: '30%' }
            ],
            collectionGoals: { WATER: 8, WOOD: 8, FIRE: 8, EARTH: 8, METAL: 8 },
            tutorial: "清除所有障碍，五行归位！"
        },
        // Level 28: 源头枯竭与相生自救 (Source Depletion & Generation Rescue) - Index 27
        {
            sourceHoles: [
                { element: 'WOOD', initialPeople: 8, maxPeople: 10, regenerationRate: 5000 },
                { element: 'FIRE', initialPeople: 8, maxPeople: 10, regenerationRate: 5000 }
                // No Earth Source initially
            ],
            targetHoles: [
                { element: 'WOOD', capacity: 8, x: '20%', y: '30%' },
                { 
                    element: 'FIRE', capacity: 8, x: '50%', y: '30%', 
                    generationInput: { sourceElement: 'WOOD', effectType: 'SPAWN_NEAR_HOLE', spawnElement: 'FIRE', amount: 1 }
                },
                { 
                    element: 'EARTH', capacity: 8, x: '80%', y: '30%', 
                    generationInput: { sourceElement: 'FIRE', effectType: 'SPAWN_NEAR_HOLE', spawnElement: 'EARTH', amount: 1 }
                }
            ],
            collectionGoals: { WOOD: 8, FIRE: 8, EARTH: 8 },
            tutorial: "源头不足？利用相生之力创造所需元素！"
        },
        // Level 29: 全神秘小人挑战 (All Mystery People Challenge) - Index 28
        {
            sourceHoles: [
                { element: 'MYSTERY', initialPeople: 20, maxPeople: 30, regenerationRate: 2000 },
                { element: 'MYSTERY', initialPeople: 20, maxPeople: 30, regenerationRate: 2200 }
            ],
            targetHoles: [
                { element: 'WATER', capacity: 6, x: '15%', y: '25%' },
                { element: 'WOOD', capacity: 6, x: '15%', y: '75%' },
                { element: 'FIRE', capacity: 6, x: '85%', y: '25%' },
                { element: 'EARTH', capacity: 6, x: '85%', y: '75%' }
            ],
            collectionGoals: { WATER: 6, WOOD: 6, FIRE: 6, EARTH: 6 },
            tutorial: "神秘小人大混战！"
        },
        // Level 30: 中期Boss关/五行逆转 (Mid-Boss: Wuxing Reversal)
        {
            sourceHoles: [
                { element: 'WATER', initialPeople: 12, maxPeople: 18, regenerationRate: 2800 },
                { element: 'WOOD', initialPeople: 12, maxPeople: 18, regenerationRate: 2800 },
                { element: 'FIRE', initialPeople: 12, maxPeople: 18, regenerationRate: 2800 },
                { element: 'EARTH', initialPeople: 12, maxPeople: 18, regenerationRate: 2800 },
                { element: 'METAL', initialPeople: 12, maxPeople: 18, regenerationRate: 2800 }
            ],
            targetHoles: [
                { element: 'FIRE', capacity: 10, x: '50%', y: '15%' }, 
                { element: 'EARTH', capacity: 10, x: '80%', y: '35%' },// Expects EARTH
                { element: 'METAL', capacity: 10, x: '70%', y: '75%' },// Expects METAL
                { element: 'WATER', capacity: 10, x: '30%', y: '75%' },// Expects WATER
                { element: 'WOOD', capacity: 10, x: '20%', y: '35%' }  // Expects WOOD
            ],
            obstacles: [
                { type: 'EARTH_OBSTACLE', x: '50%', y: '50%' } // Central obstacle
            ],
            collectionGoals: { FIRE: 10, EARTH: 10, METAL: 10, WATER: 10, WOOD: 10 },
            tutorial: "五行逆转！小心应对洞穴的异常！"
        },
        // Level 31: 高级策略 - 隧道与障碍组合
        {
            sourceHoles: [
                { element: 'WATER', initialPeople: 15, maxPeople: 20, regenerationRate: 3000 },
                { element: 'FIRE', initialPeople: 10, maxPeople: 15, regenerationRate: 3000 }
            ],
            targetHoles: [
                { element: 'WATER', capacity: 15, x: '80%', y: '25%' }, // Needs tunnel
                { element: 'FIRE', capacity: 10, x: '80%', y: '75%' }  // Needs tunnel & obstacle clear
            ],
            obstacles: [
                { type: 'METAL_OBSTACLE', x: '60%', y: '75%' } // Fire clears this
            ],
            tunnels: [
                { id: 'T_MAIN', entryX: '20%', entryY: '50%', exitX: '50%', exitY: '50%' }
            ],
            collectionGoals: { WATER: 15, FIRE: 10 },
            tutorial: "利用隧道，清除障碍，规划路径！"
        },
        // Level 32: 特定五行强化 - 水源充沛
        {
            sourceHoles: [
                { element: 'WATER', initialPeople: 30, maxPeople: 40, regenerationRate: 1500 }, // Abundant Water
                { element: 'WOOD', initialPeople: 5, maxPeople: 10, regenerationRate: 4000 },  // Scarce Wood
                { element: 'EARTH', initialPeople: 5, maxPeople: 10, regenerationRate: 4000 }  // Scarce Earth
            ],
            targetHoles: [
                { element: 'WATER', capacity: 20, x: '25%', y: '30%' },
                { 
                    element: 'WOOD', capacity: 10, x: '50%', y: '60%',
                    generationInput: { sourceElement: 'WATER', effectType: 'SPAWN_AT_SOURCE', targetSourceElement: 'WOOD', amount: 3 }
                },
                { 
                    element: 'EARTH', capacity: 10, x: '75%', y: '30%',
                     // Earth is scarce, needs a lot of water to generate wood, then wood to overcome obstacle for earth.
                }
            ],
            obstacles: [ { type: 'EARTH_OBSTACLE', x: '75%', y: '50%', clearedBy: 'WOOD' } ], // Wood clears Earth
            collectionGoals: { WATER: 20, WOOD: 10, EARTH: 10 },
            tutorial: "水源充沛！巧妙利用水生木，木克土！"
        },
        // Level 33: 动态变化 - 目标洞穴容量改变 (Conceptual - visual change, actual capacity fixed)
        {
            sourceHoles: [
                { element: 'FIRE', initialPeople: 15, regenerationRate: 2500, maxPeople: 20 },
                { element: 'METAL', initialPeople: 15, regenerationRate: 2500, maxPeople: 20 }
            ],
            targetHoles: [
                { element: 'FIRE', capacity: 10, x: '30%', y: '30%' }, // Initially looks like it needs 5
                { element: 'METAL', capacity: 10, x: '70%', y: '70%' } // Initially looks like it needs 15
            ],
            collectionGoals: { FIRE: 10, METAL: 10 },
            tutorial: "洞穴的需求似乎在变化？仔细观察！(实际容量固定)"
        },
        // Level 34: 五行之力应用 - 连锁相生与克制
        {
            sourceHoles: [
                { element: 'WATER', initialPeople: 10, maxPeople: 15, regenerationRate: 3000 },
                { element: 'WOOD', initialPeople: 5, maxPeople: 10, regenerationRate: 4000 },
                { element: 'FIRE', initialPeople: 5, maxPeople: 10, regenerationRate: 4500 },
                { element: 'METAL', initialPeople: 5, maxPeople: 10, regenerationRate: 4500 }
            ],
            targetHoles: [
                { element: 'WATER', capacity: 10, x: '15%', y: '50%' },
                { 
                    element: 'WOOD', capacity: 8, x: '40%', y: '25%', // Water generates Wood
                    generationInput: { sourceElement: 'WATER', effectType: 'SPAWN_AT_SOURCE', targetSourceElement: 'WOOD', amount: 2 }
                },
                { 
                    element: 'FIRE', capacity: 8, x: '40%', y: '75%', // Wood generates Fire
                    generationInput: { sourceElement: 'WOOD', effectType: 'SPAWN_AT_SOURCE', targetSourceElement: 'FIRE', amount: 2 }
                },
                { element: 'METAL', capacity: 8, x: '85%', y: '50%'} // Path to Metal is blocked
            ],
            obstacles: [ { type: 'WOOD_OBSTACLE', x: '65%', y: '50%', clearedBy: 'METAL'} ], // Metal needed for obstacle too
            collectionGoals: { WATER: 10, WOOD: 8, FIRE: 8, METAL: 8 },
            tutorial: "连锁反应！利用相生获取资源，克制障碍！"
        },
        // Level 35: 隧道迷宫与元素转换
        {
            sourceHoles: [
                { element: 'WATER', initialPeople: 20, maxPeople: 25, regenerationRate: 2000 },
                { element: 'WOOD', initialPeople: 10, maxPeople: 15, regenerationRate: 3000 }
            ],
            targetHoles: [
                { element: 'WATER', capacity: 10, x: '20%', y: '20%' },
                { element: 'WOOD', capacity: 10, x: '80%', y: '20%' },
                { element: 'FIRE', capacity: 10, x: '50%', y: '80%' } // Needs transformation
            ],
            tunnels: [
                { id: 'T_W1', entryX: '20%', entryY: '50%', exitX: '40%', exitY: '20%' }, // To Wood Target
                { id: 'T_F1', entryX: '50%', entryY: '20%', exitX: '50%', exitY: '60%', transformTo: 'FIRE' } // Wood to Fire
            ],
            collectionGoals: { WATER: 10, WOOD: 10, FIRE: 10 },
            tutorial: "复杂的隧道网络与元素转换！"
        },
        // Level 36: 多重障碍与稀缺资源
        {
            sourceHoles: [
                { element: 'METAL', initialPeople: 8, maxPeople: 12, regenerationRate: 3500 },
                { element: 'FIRE', initialPeople: 8, maxPeople: 12, regenerationRate: 3500 },
                { element: 'EARTH', initialPeople: 15, maxPeople: 20, regenerationRate: 2500 }
            ],
            targetHoles: [
                { element: 'METAL', capacity: 8, x: '20%', y: '70%' },
                { element: 'FIRE', capacity: 8, x: '80%', y: '70%' },
                { element: 'EARTH', capacity: 15, x: '50%', y: '25%' }
            ],
            obstacles: [
                { type: 'WOOD_OBSTACLE', x: '20%', y: '40%', clearedBy: 'METAL' }, // Path to Metal hole
                { type: 'METAL_OBSTACLE', x: '80%', y: '40%', clearedBy: 'FIRE' } // Path to Fire hole
            ],
            collectionGoals: { METAL: 8, FIRE: 8, EARTH: 15 },
            tutorial: "资源有限，清除多种障碍！"
        },
        // Level 37: 神秘与相生并存
        {
            sourceHoles: [
                { element: 'MYSTERY', initialPeople: 15, maxPeople: 20, regenerationRate: 2000 },
                { element: 'WATER', initialPeople: 10, maxPeople: 15, regenerationRate: 3000 }
            ],
            targetHoles: [
                { element: 'WOOD', capacity: 10, x: '30%', y: '30%', 
                  generationInput: { sourceElement: 'WATER', effectType: 'SPAWN_AT_SOURCE', targetSourceElement: 'WOOD', amount: 2 } 
                }, // Wood source does not exist, must be generated
                { element: 'FIRE', capacity: 10, x: '70%', y: '30%' }, // Must come from Mystery
                { element: 'WATER', capacity: 10, x: '50%', y: '70%' }
            ],
            collectionGoals: { WOOD: 10, FIRE: 10, WATER: 10 },
            tutorial: "神秘元素与相生之力，灵活运用！"
        },
        // Level 38: 路径优化挑战
        {
            sourceHoles: [
                { element: 'WOOD', initialPeople: 20, maxPeople: 30, regenerationRate: 1500 }, // Fast regen
                { element: 'EARTH', initialPeople: 20, maxPeople: 30, regenerationRate: 1500 }
            ],
            targetHoles: [
                { element: 'WOOD', capacity: 15, x: '15%', y: '15%' },
                { element: 'EARTH', capacity: 15, x: '85%', y: '15%' },
                { element: 'WOOD', capacity: 5, x: '15%', y: '85%' },
                { element: 'EARTH', capacity: 5, x: '85%', y: '85%' }
            ],
            obstacles: [
                { type: 'WATER_OBSTACLE', x: '50%', y: '30%', clearedBy: 'FIRE' }, // Requires fire, but no fire source. So this path blocked. Path around.
                                                                                // Let's make it Earth obstacle, cleared by Wood
                { type: 'EARTH_OBSTACLE', x: '50%', y: '50%', clearedBy: 'WOOD' }
            ],
            collectionGoals: { WOOD: 20, EARTH: 20 },
            tutorial: "规划最佳路径，高效收集！"
        },
        // Level 39: 概念上的 “小结局” - 五行和谐 (Simplified)
        {
            sourceHoles: [
                { element: 'WATER', initialPeople: 10, maxPeople: 15, regenerationRate: 2500 },
                { element: 'WOOD', initialPeople: 10, maxPeople: 15, regenerationRate: 2500 },
                { element: 'FIRE', initialPeople: 10, maxPeople: 15, regenerationRate: 2500 },
                { element: 'EARTH', initialPeople: 10, maxPeople: 15, regenerationRate: 2500 },
                { element: 'METAL', initialPeople: 10, maxPeople: 15, regenerationRate: 2500 }
            ],
            targetHoles: [ // Arranged in a circle or pentagram visually
                { element: 'WATER', capacity: 10, x: '50%', y: '10%' },
                { element: 'WOOD', capacity: 10, x: '75%', y: '30%' },
                { element: 'FIRE', capacity: 10, x: '65%', y: '70%' },
                { element: 'EARTH', capacity: 10, x: '35%', y: '70%' },
                { element: 'METAL', capacity: 10, x: '25%', y: '30%' }
            ],
            obstacles: [],
            collectionGoals: { WATER: 10, WOOD: 10, FIRE: 10, EARTH: 10, METAL: 10 },
            tutorial: "五行归位，万物和谐！"
        },
        // Level 40: 五行大和谐 - 终极挑战 (Simplified from user's L40 concept)
        {
            sourceHoles: [
                { element: 'MYSTERY', initialPeople: 25, maxPeople: 35, regenerationRate: 1800 }
            ],
            targetHoles: [
                { element: 'WATER', capacity: 8, x: '10%', y: '10%' },
                { element: 'WOOD', capacity: 8, x: '10%', y: '80%' },
                { element: 'FIRE', capacity: 8, x: '85%', y: '10%' },
                { element: 'EARTH', capacity: 8, x: '85%', y: '80%' },
                { element: 'METAL', capacity: 8, x: '50%', y: '50%', generationInput: { sourceElement: 'EARTH', effectType: 'SPAWN_AT_SOURCE', targetSourceElement: 'METAL', amount: 1 } } // Earth (from mystery) must gen Metal
            ],
            obstacles: [ { type: 'WOOD_OBSTACLE', x: '50%', y: '25%', clearedBy: 'METAL'} ], // Metal needed for obstacle too
            tunnels: [
                { id: 'T_TRANSFORM', entryX: '30%', entryY: '50%', exitX: '70%', exitY: '50%', transformTo: 'FIRE'} // A way to get specific fire
            ],
            collectionGoals: { WATER: 8, WOOD: 8, FIRE: 8, EARTH: 8, METAL: 8 },
            tutorial: "终极挑战：五行大和谐！智慧与耐心的考验！"
        },
        // Level 41: 五行共鸣 (Simplified)
        {
            sourceHoles: [
                { element: 'WATER', initialPeople: 10, regenerationRate: 2500, maxPeople: 15 },
                { element: 'WOOD', initialPeople: 10, regenerationRate: 2500, maxPeople: 15 },
                { element: 'FIRE', initialPeople: 10, regenerationRate: 2500, maxPeople: 15 }
            ],
            targetHoles: [
                { element: 'WATER', capacity: 10, x: '20%', y: '50%' },
                { element: 'WOOD', capacity: 10, x: '50%', y: '20%' },
                { element: 'FIRE', capacity: 10, x: '80%', y: '50%' }
            ],
            collectionGoals: { WATER: 10, WOOD: 10, FIRE: 10 },
            tutorial: "场上有共鸣点！尝试让不同属性的小人同时经过它，引发五行共鸣！(提示：齐心协力)"
        },
        // Level 42: 时序障碍 (Simplified: Complex pathing implying timing)
        {
            sourceHoles: [
                { element: 'METAL', initialPeople: 15, regenerationRate: 2000, maxPeople: 20 },
                { element: 'EARTH', initialPeople: 15, regenerationRate: 2000, maxPeople: 20 }
            ],
            targetHoles: [
                { element: 'METAL', capacity: 10, x: '15%', y: '15%' },
                { element: 'EARTH', capacity: 10, x: '85%', y: '85%' },
                { element: 'METAL', capacity: 5, x: '85%', y: '15%' }, // Requires crossing
                { element: 'EARTH', capacity: 5, x: '15%', y: '85%' }  // Requires crossing
            ],
            obstacles: [
                { type: 'WOOD_OBSTACLE', x: '50%', y: '30%', clearedBy: 'METAL' },
                { type: 'FIRE_OBSTACLE', x: '50%', y: '70%', clearedBy: 'WATER' } // No water source, this path blocked
            ],
            collectionGoals: { METAL: 15, EARTH: 15 },
            tutorial: "障碍重重，把握时机，规划路径！"
        },
        // Level 43: 属性吸附区域 (Simplified: Strategic hole placement)
        {
            sourceHoles: [
                { element: 'WATER', initialPeople: 10, regenerationRate: 3000, maxPeople: 15 },
                { element: 'FIRE', initialPeople: 10, regenerationRate: 3000, maxPeople: 15 },
                { element: 'METAL', initialPeople: 10, regenerationRate: 3000, maxPeople: 15 }
            ],
            targetHoles: [
                { element: 'WATER', capacity: 10, x: '25%', y: '25%' }, // Close to its source
                { element: 'FIRE', capacity: 10, x: '75%', y: '25%' }, // Far from source, near Water target
                { element: 'METAL', capacity: 10, x: '50%', y: '75%' }  // Central, away from others
            ],
            collectionGoals: { WATER: 10, FIRE: 10, METAL: 10 },
            tutorial: "感受元素的吸引力，巧妙利用布局！"
        },
        // Level 44: 连锁克制挑战
        {
            sourceHoles: [
                { element: 'WATER', initialPeople: 10, regenerationRate: 2500, maxPeople: 15 },
                { element: 'FIRE', initialPeople: 5, regenerationRate: 3500, maxPeople: 8 }, // Limited Fire
                { element: 'WOOD', initialPeople: 15, regenerationRate: 2000, maxPeople: 20 } // Abundant Wood for Earth Obstacle
            ],
            targetHoles: [
                { element: 'WATER', capacity: 10, x: '15%', y: '50%' },
                { element: 'FIRE', capacity: 5, x: '50%', y: '15%' },
                { element: 'WOOD', capacity: 15, x: '85%', y: '50%' }
            ],
            obstacles: [
                { type: 'FIRE_OBSTACLE', x: '50%', y: '40%', clearedBy: 'WATER' }, // Water clears Fire
                { type: 'METAL_OBSTACLE', x: '50%', y: '60%', clearedBy: 'FIRE' } // Fire (now available) clears Metal
            ],
            collectionGoals: { WATER: 10, FIRE: 5, WOOD: 15 },
            tutorial: "连锁克制！按顺序清除障碍。"
        },
        // Level 45: 五行平衡挑战 (Simplified: Equal goals)
        {
            sourceHoles: [
                { element: 'WATER', initialPeople: 8, regenerationRate: 3000, maxPeople: 12 },
                { element: 'WOOD', initialPeople: 8, regenerationRate: 3000, maxPeople: 12 },
                { element: 'FIRE', initialPeople: 8, regenerationRate: 3000, maxPeople: 12 },
                { element: 'EARTH', initialPeople: 8, regenerationRate: 3000, maxPeople: 12 },
                { element: 'METAL', initialPeople: 8, regenerationRate: 3000, maxPeople: 12 }
            ],
            targetHoles: [
                { element: 'WATER', capacity: 5, x: '50%', y: '10%' },
                { element: 'WOOD', capacity: 5, x: '80%', y: '30%' },
                { element: 'FIRE', capacity: 5, x: '70%', y: '70%' },
                { element: 'EARTH', capacity: 5, x: '30%', y: '70%' },
                { element: 'METAL', capacity: 5, x: '20%', y: '30%' }
            ],
            collectionGoals: { WATER: 5, WOOD: 5, FIRE: 5, EARTH: 5, METAL: 5 },
            tutorial: "五行平衡！尽可能平均收集所有元素。"
        },
        // Level 46: 移动的源/目标洞穴 (Simplified: Tricky placement)
        {
            sourceHoles: [
                { element: 'WATER', initialPeople: 15, regenerationRate: 2000, maxPeople: 20 },
                { element: 'WOOD', initialPeople: 15, regenerationRate: 2000, maxPeople: 20 }
            ],
            targetHoles: [
                { element: 'WATER', capacity: 10, x: '10%', y: '10%' }, // Top-left
                { element: 'WOOD', capacity: 10, x: '90%', y: '10%' }, // Top-right
                { element: 'WATER', capacity: 5, x: '10%', y: '90%' },  // Bottom-left
                { element: 'WOOD', capacity: 5, x: '90%', y: '90%' }   // Bottom-right
            ],
            tunnels: [
                { id: 'CROSS_H', entryX: '30%', entryY: '50%', exitX: '70%', exitY: '50%' }
            ],
            collectionGoals: { WATER: 15, WOOD: 15 },
            tutorial: "洞穴位置刁钻，小心规划！"
        },
        // Level 47: 五行之潮汐 (Simplified: Source regen boost)
        {
            sourceHoles: [
                { element: 'METAL', initialPeople: 10, regenerationRate: 2500, maxPeople: 15 },
                { element: 'WATER', initialPeople: 5, regenerationRate: 4000, maxPeople: 10 }, // Slow regen initially
                { element: 'EARTH', initialPeople: 10, regenerationRate: 2500, maxPeople: 15 }
            ],
            targetHoles: [
                { element: 'METAL', capacity: 10, x: '25%', y: '30%' },
                { 
                    element: 'WATER', capacity: 10, x: '50%', y: '60%',
                    generationInput: { sourceElement: 'METAL', effectType: 'SOURCE_REGEN_BOOST', targetSourceElement: 'WATER', multiplier: 0.3, duration: 15000 }
                },
                { element: 'EARTH', capacity: 10, x: '75%', y: '30%' }
            ],
            collectionGoals: { METAL: 10, WATER: 10, EARTH: 10 },
            tutorial: "注意五行潮汐的变化！(提示：金能生水，加速源泉！)"
        },
        // Level 48: 复制小人机制 (Simplified: Generation mimicking copying)
        {
            sourceHoles: [
                { element: 'WOOD', initialPeople: 8, regenerationRate: 3000, maxPeople: 12 }, // Limited Wood
                { element: 'FIRE', initialPeople: 3, regenerationRate: 5000, maxPeople: 6 }   // Very limited Fire
            ],
            targetHoles: [
                { element: 'WOOD', capacity: 16, x: '30%', y: '50%' }, // Needs a lot of Wood
                { 
                    element: 'FIRE', capacity: 10, x: '70%', y: '50%', // Needs a lot of Fire
                    generationInput: { sourceElement: 'WOOD', effectType: 'SPAWN_AT_SOURCE', targetSourceElement: 'FIRE', amount: 2 } // Wood helps "copy" Fire
                }
            ],
            collectionGoals: { WOOD: 16, FIRE: 10 },
            tutorial: "源头不足？利用相生之力！"
        },
        // Level 49: 五行风水阵 (Simplified: Holes in pentagram, tutorial suggests order)
        {
            sourceHoles: [
                { element: 'WATER', initialPeople: 8, regenerationRate: 2800, maxPeople: 12 },
                { element: 'WOOD', initialPeople: 8, regenerationRate: 2800, maxPeople: 12 },
                { element: 'FIRE', initialPeople: 8, regenerationRate: 2800, maxPeople: 12 },
                { element: 'EARTH', initialPeople: 8, regenerationRate: 2800, maxPeople: 12 },
                { element: 'METAL', initialPeople: 8, regenerationRate: 2800, maxPeople: 12 }
            ],
            targetHoles: [ // Arranged in Wuxing generation cycle (Water -> Wood -> Fire -> Earth -> Metal)
                { element: 'WATER', capacity: 8, x: '50%', y: '10%' }, // Top
                { element: 'WOOD', capacity: 8, x: '18%', y: '35%' }, // Left-Top
                { element: 'FIRE', capacity: 8, x: '30%', y: '80%' }, // Bottom-Left
                { element: 'EARTH', capacity: 8, x: '70%', y: '80%' }, // Bottom-Right
                { element: 'METAL', capacity: 8, x: '82%', y: '35%' }  // Right-Top
            ],
            collectionGoals: { WATER: 8, WOOD: 8, FIRE: 8, EARTH: 8, METAL: 8 },
            tutorial: "五行风水阵！尝试按水木火土金的顺序填满洞穴！"
        },
        // Level 50: 阶段Boss关 - 五行元素领主 (Simplified: Complex 5-element, multi-obstacle, high goal)
        {
            sourceHoles: [
                { element: 'WATER', initialPeople: 15, regenerationRate: 2000, maxPeople: 20 },
                { element: 'WOOD', initialPeople: 15, regenerationRate: 2000, maxPeople: 20 },
                { element: 'FIRE', initialPeople: 15, regenerationRate: 2000, maxPeople: 20 },
                { element: 'EARTH', initialPeople: 15, regenerationRate: 2000, maxPeople: 20 },
                { element: 'METAL', initialPeople: 15, regenerationRate: 2000, maxPeople: 20 }
            ],
            targetHoles: [
                { element: 'WATER', capacity: 12, x: '10%', y: '50%' },
                { element: 'WOOD', capacity: 12, x: '30%', y: '15%' },
                { element: 'FIRE', capacity: 12, x: '50%', y: '85%' },
                { element: 'EARTH', capacity: 12, x: '70%', y: '15%' },
                { element: 'METAL', capacity: 12, x: '90%', y: '50%' }
            ],
            obstacles: [
                { type: 'FIRE_OBSTACLE', x: '20%', y: '30%', clearedBy: 'WATER' },
                { type: 'EARTH_OBSTACLE', x: '40%', y: '50%', clearedBy: 'WOOD' },
                { type: 'METAL_OBSTACLE', x: '60%', y: '50%', clearedBy: 'FIRE' },
                { type: 'WOOD_OBSTACLE', x: '80%', y: '70%', clearedBy: 'METAL' },
                { type: 'WATER_OBSTACLE', x: '50%', y: '30%', clearedBy: 'FIRE'} // Note: FIRE must clear WATER_OBSTACLE and METAL_OBSTACLE. Needs planning.
            ],
            tunnels: [
                { id: 'BOSS_T1', entryX: '15%', entryY: '80%', exitX: '85%', exitY: '25%'}
            ],
            collectionGoals: { WATER: 12, WOOD: 12, FIRE: 12, EARTH: 12, METAL: 12 },
            tutorial: "元素领主降临！运用你所有的智慧！"
        },
        // Level 51: 黑暗模式/视野受限 (Simplified: Mystery sources, maze-like tunnels)
        {
            sourceHoles: [
                { element: 'MYSTERY', initialPeople: 20, regenerationRate: 2000, maxPeople: 30 },
                { element: 'MYSTERY', initialPeople: 15, regenerationRate: 2200, maxPeople: 25 }
            ],
            targetHoles: [
                { element: 'WATER', capacity: 8, x: '85%', y: '15%' },
                { element: 'WOOD', capacity: 8, x: '15%', y: '85%' },
                { element: 'FIRE', capacity: 8, x: '85%', y: '85%' }
            ],
            tunnels: [
                { id: 'M1', entryX: '15%', entryY: '15%', exitX: '50%', exitY: '50%' },
                { id: 'M2', entryX: '50%', entryY: '15%', exitX: '15%', exitY: '50%' },
                { id: 'M3', entryX: '50%', entryY: '85%', exitX: '85%', exitY: '50%' }
            ],
            collectionGoals: { WATER: 8, WOOD: 8, FIRE: 8 },
            tutorial: "迷雾重重，小心探索！"
        },
        // Level 52: 反向拖拽/推小人 (Simplified: Choke points)
        {
            sourceHoles: [
                { element: 'EARTH', initialPeople: 25, regenerationRate: 1500, maxPeople: 35 }
            ],
            targetHoles: [
                { element: 'EARTH', capacity: 10, x: '10%', y: '50%' },
                { element: 'EARTH', capacity: 15, x: '90%', y: '50%' } // Needs to go through narrow passage
            ],
            obstacles: [ // Create a narrow passage
                { type: 'WOOD_OBSTACLE', x: '50%', y: '35%', clearedBy: 'METAL' }, // Unclearable with Earth only
                { type: 'WOOD_OBSTACLE', x: '50%', y: '65%', clearedBy: 'METAL' }  // Unclearable
            ],
             tunnels: [ // Use tunnels to create fixed narrow path
                { id: 'NARROW', entryX: '30%', entryY: '50%', exitX: '70%', exitY: '50%'}
            ],
            collectionGoals: { EARTH: 25 },
            tutorial: "巧妙引导，克服狭窄的路径！"
        },
        // Level 53: 融合小人 (Simplified: Element transformation tunnels)
        {
            sourceHoles: [
                { element: 'WATER', initialPeople: 15, regenerationRate: 2500, maxPeople: 20 },
                { element: 'METAL', initialPeople: 15, regenerationRate: 2500, maxPeople: 20 }
            ],
            targetHoles: [
                { element: 'WATER', capacity: 5, x: '15%', y: '15%' },
                { element: 'METAL', capacity: 5, x: '85%', y: '15%' },
                { element: 'WOOD', capacity: 10, x: '50%', y: '80%'} // Needs transformation
            ],
            tunnels: [
                { id: 'T_W_WOOD', entryX: '30%', entryY: '50%', exitX: '40%', exitY: '70%', transformTo: 'WOOD' }, // Water to Wood
                { id: 'T_M_WOOD', entryX: '70%', entryY: '50%', exitX: '60%', exitY: '70%', transformTo: 'WOOD' }  // Metal to Wood
            ],
            collectionGoals: { WATER: 5, METAL: 5, WOOD: 10 },
            tutorial: "通过特殊隧道融合元素！"
        },
        // Level 54: 共享容量洞穴 (Simplified: Close holes, careful distribution)
        {
            sourceHoles: [
                { element: 'FIRE', initialPeople: 20, regenerationRate: 2000, maxPeople: 25 },
                { element: 'EARTH', initialPeople: 20, regenerationRate: 2000, maxPeople: 25 }
            ],
            targetHoles: [
                // These two are close, suggesting shared resource pool for player
                { element: 'FIRE', capacity: 12, x: '45%', y: '40%' },
                { element: 'EARTH', capacity: 12, x: '55%', y: '40%' },
                // These are separate
                { element: 'FIRE', capacity: 8, x: '20%', y: '70%' },
                { element: 'EARTH', capacity: 8, x: '80%', y: '70%' }
            ],
            collectionGoals: { FIRE: 20, EARTH: 20 },
            tutorial: "资源有限，明智分配！"
        },
        // Level 55: 牺牲与献祭 (Simplified: Scarce element for tough obstacle)
        {
            sourceHoles: [
                { element: 'WOOD', initialPeople: 20, regenerationRate: 2000, maxPeople: 30 }, // Abundant
                { element: 'FIRE', initialPeople: 5, regenerationRate: 4000, maxPeople: 8 },   // Scarce
                { element: 'EARTH', initialPeople: 10, regenerationRate: 3000, maxPeople: 15 }
            ],
            targetHoles: [
                { element: 'WOOD', capacity: 20, x: '20%', y: '30%' },
                { element: 'EARTH', capacity: 10, x: '80%', y: '70%' } // Path blocked by tough FIRE_OBSTACLE
            ],
            obstacles: [
                { type: 'METAL_OBSTACLE', x: '50%', y: '50%', clearedBy: 'FIRE' } // Needs scarce Fire
            ],
            collectionGoals: { WOOD: 20, EARTH: 10 }, // Fire is not collected, only used for obstacle
            tutorial: "有时牺牲是必要的...用稀有的火焰清除障碍。"
        },
        // Level 56: 传送带与方向改变 (Simplified: Series of forcing tunnels)
        {
            sourceHoles: [
                { element: 'WATER', initialPeople: 20, regenerationRate: 1800, maxPeople: 30 }
            ],
            targetHoles: [
                { element: 'WATER', capacity: 10, x: '10%', y: '10%' }, // Final destination
                { element: 'WATER', capacity: 10, x: '90%', y: '90%' }  // Another final destination
            ],
            tunnels: [ // Creates a fixed path
                { id: 'CV1', entryX: '15%', entryY: '50%', exitX: '40%', exitY: '50%' },
                { id: 'CV2', entryX: '40%', entryY: '50%', exitX: '40%', exitY: '20%' }, // Up
                { id: 'CV3', entryX: '40%', entryY: '20%', exitX: '15%', exitY: '20%' }, // Left to target 1
                { id: 'CV4', entryX: '15%', entryY: '50%', exitX: '60%', exitY: '50%' }, // Alternative from start for 2nd target
                { id: 'CV5', entryX: '60%', entryY: '50%', exitX: '60%', exitY: '80%' }, // Down
                { id: 'CV6', entryX: '60%', entryY: '80%', exitX: '85%', exitY: '80%' }  // Right to target 2
            ],
            collectionGoals: { WATER: 20 },
            tutorial: "小心！这些隧道会改变你的路径！"
        },
        // Level 57: 五行天气系统 (Simplified: Multiple varied generation effects)
        {
            sourceHoles: [
                { element: 'WATER', initialPeople: 8, regenerationRate: 3500, maxPeople: 12 },
                { element: 'WOOD', initialPeople: 8, regenerationRate: 3500, maxPeople: 12 },
                { element: 'FIRE', initialPeople: 8, regenerationRate: 3500, maxPeople: 12 }
            ],
            targetHoles: [
                { 
                    element: 'WATER', capacity: 10, x: '20%', y: '20%',
                    generationInput: { sourceElement: 'METAL', effectType: 'SOURCE_REGEN_BOOST', targetSourceElement: 'WATER', multiplier: 0.5, duration: 10000 } // Metal (not present) would boost water
                },
                { 
                    element: 'WOOD', capacity: 10, x: '50%', y: '50%',
                    generationInput: { sourceElement: 'WATER', effectType: 'SPAWN_AT_SOURCE', targetSourceElement: 'WOOD', amount: 2 } // Water generates wood
                },
                { 
                    element: 'FIRE', capacity: 10, x: '80%', y: '80%',
                    generationInput: { sourceElement: 'WOOD', effectType: 'SPAWN_NEAR_HOLE', spawnElement: 'FIRE', amount: 1 } // Wood spawns fire
                }
            ],
            collectionGoals: { WATER: 10, WOOD: 10, FIRE: 10 },
            tutorial: "五行之力流转不定，抓住时机！"
        },
        // Level 58: 守护目标 (Simplified: Rare element, low capacity hole, obstacles)
        {
            sourceHoles: [
                { element: 'METAL', initialPeople: 20, regenerationRate: 2000, maxPeople: 30 }, // Main element for clearing
                { element: 'EARTH', initialPeople: 3, regenerationRate: 5000, maxPeople: 5 }    // The "VIP" element
            ],
            targetHoles: [
                { element: 'METAL', capacity: 20, x: '20%', y: '70%' },
                { element: 'EARTH', capacity: 3, x: '80%', y: '30%' } // The "VIP" target
            ],
            obstacles: [
                { type: 'WOOD_OBSTACLE', x: '60%', y: '30%', clearedBy: 'METAL' }, // Obstacle guarding VIP path
                { type: 'WOOD_OBSTACLE', x: '70%', y: '50%', clearedBy: 'METAL' }  // Another one
            ],
            collectionGoals: { METAL: 20, EARTH: 3 },
            tutorial: "保护这个特殊的小人，安全送达！"
        },
        // Level 59: 多层级地图/Z轴概念 (Simplified: Tunnels for "level change" illusion)
        {
            sourceHoles: [
                { element: 'FIRE', initialPeople: 15, regenerationRate: 2200, maxPeople: 20 },
                { element: 'WATER', initialPeople: 15, regenerationRate: 2200, maxPeople: 20 }
            ],
            targetHoles: [
                { element: 'FIRE', capacity: 10, x: '20%', y: '20%' }, // "Upper level"
                { element: 'WATER', capacity: 10, x: '80%', y: '80%' }  // "Lower level"
            ],
            tunnels: [ // Tunnel connecting "upper left" to "lower right" areas
                { id: 'LVL_CHG_1', entryX: '40%', entryY: '30%', exitX: '60%', exitY: '70%' },
                // Add another tunnel to make it more "multi-level"
                { id: 'LVL_CHG_2', entryX: '70%', entryY: '20%', exitX: '30%', exitY: '80%' } // Water source to Fire Target area
            ],
            collectionGoals: { FIRE: 10, WATER: 10 },
            tutorial: "穿梭于不同层级，完成使命！"
        },
        // Level 60: 阶段Boss关 - 五行元素领主 (Simplified: Complex 5-element, multi-obstacle, high goal)
        {
            sourceHoles: [
                { element: 'WATER', initialPeople: 15, regenerationRate: 2000, maxPeople: 20 },
                { element: 'WOOD', initialPeople: 15, regenerationRate: 2000, maxPeople: 20 },
                { element: 'FIRE', initialPeople: 15, regenerationRate: 2000, maxPeople: 20 },
                { element: 'EARTH', initialPeople: 15, regenerationRate: 2000, maxPeople: 20 },
                { element: 'METAL', initialPeople: 15, regenerationRate: 2000, maxPeople: 20 }
            ],
            targetHoles: [
                { element: 'WATER', capacity: 12, x: '10%', y: '50%' },
                { element: 'WOOD', capacity: 12, x: '30%', y: '15%' },
                { element: 'FIRE', capacity: 12, x: '50%', y: '85%' },
                { element: 'EARTH', capacity: 12, x: '70%', y: '15%' },
                { element: 'METAL', capacity: 12, x: '90%', y: '50%' }
            ],
            obstacles: [
                { type: 'FIRE_OBSTACLE', x: '20%', y: '30%', clearedBy: 'WATER' },
                { type: 'EARTH_OBSTACLE', x: '40%', y: '50%', clearedBy: 'WOOD' },
                { type: 'METAL_OBSTACLE', x: '60%', y: '50%', clearedBy: 'FIRE' },
                { type: 'WOOD_OBSTACLE', x: '80%', y: '70%', clearedBy: 'METAL' },
                { type: 'WATER_OBSTACLE', x: '50%', y: '30%', clearedBy: 'FIRE'} // Note: FIRE must clear WATER_OBSTACLE and METAL_OBSTACLE. Needs planning.
            ],
            tunnels: [
                { id: 'BOSS_T1', entryX: '15%', entryY: '80%', exitX: '85%', exitY: '25%'}
            ],
            collectionGoals: { WATER: 12, WOOD: 12, FIRE: 12, EARTH: 12, METAL: 12 },
            tutorial: "元素领主降临！运用你所有的智慧！"
        }
    ];

    function initLevel(levelNumber) {
        gameState.level = levelNumber;
        gameState.isLevelComplete = false;
        gameState.sourceHoles.forEach(sh => {
            if (sh.regenerationTimeout) {
                clearTimeout(sh.regenerationTimeout);
                if (sh.originalRegenerationRate) { // Reset boosted rate
                    sh.regenerationRate = sh.originalRegenerationRate;
                    delete sh.originalRegenerationRate;
                }
            }
        });

        const levelConfig = levels[levelNumber];
        if (!levelConfig) {
            console.error("Level not found:", levelNumber);
            showTemporaryMessage("All levels completed!", 5000, true);
            levelCompleteMessageEl.classList.remove('hidden');
            levelCompleteMessageEl.querySelector('h2').textContent = "Congratulations!";
            levelCompleteMessageEl.querySelector('p').textContent = "You've mastered all Wuxing challenges!";
            nextLevelButton.textContent = "Play Again from Start";
            nextLevelButton.onclick = () => {
                levelCompleteMessageEl.classList.add('hidden');
                initLevel(0);
            };
            return;
        }

        gameBoard.innerHTML = '';
        sourceBay.innerHTML = '';
        collectionBay.innerHTML = '';
        gameState.people = [];
        gameState.sourceHoles = [];
        gameState.targetHoles = [];
        gameState.obstacles = [];
        gameState.tunnels = []; // Clear previous tunnels
        gameState.collectedCounts = {};
        levelCompleteMessageEl.classList.add('hidden');

        // Clear existing tunnel DOM elements
        document.querySelectorAll('.tunnel-entry, .tunnel-exit').forEach(el => el.remove());

        gameState.collectionGoals = { ...levelConfig.collectionGoals };
        for (const el in gameState.collectionGoals) {
            if (WUXING[el]) { 
                gameState.collectedCounts[el] = 0;
                const slot = document.createElement('div');
                slot.classList.add('collection-slot');
                slot.dataset.element = el;
                slot.style.backgroundColor = WUXING[el].color;
                slot.innerHTML = `<img src="${WUXING[el].icon}" alt="${WUXING[el].name}"> <span class="count">0 / ${gameState.collectionGoals[el]}</span>`;
                collectionBay.appendChild(slot);
            }
        }

        levelConfig.sourceHoles.forEach((shConfig, index) => {
            const holeDiv = document.createElement('div');
            holeDiv.classList.add('hole', 'source-hole');
            holeDiv.dataset.id = `source-${index}`;
            holeDiv.dataset.element = shConfig.element;
            holeDiv.style.setProperty('--source-bg-color', WUXING[shConfig.element].color); 
            
            const iconImg = document.createElement('img');
            iconImg.src = WUXING[shConfig.element].icon;
            iconImg.alt = WUXING[shConfig.element].name;
            iconImg.style.width = '30px';
            iconImg.style.height = '30px';
            iconImg.style.opacity = '0.5';
            iconImg.style.position = 'absolute';
            iconImg.style.bottom = '5px';
            iconImg.style.left = '50%';
            iconImg.style.transform = 'translateX(-50%)';
            holeDiv.appendChild(iconImg);

            sourceBay.appendChild(holeDiv);
            
            const sourceHole = {
                id: `source-${index}`,
                element: shConfig.element,
                div: holeDiv,
                peopleCount: 0,
                maxPeople: shConfig.maxPeople,
                regenerationRate: shConfig.regenerationRate,
                regenerationTimeout: null
            };
            gameState.sourceHoles.push(sourceHole);
            replenishSourceHole(sourceHole, shConfig.initialPeople);

            holeDiv.addEventListener('mousedown', (e) => handleSourceMouseDown(e, sourceHole));
        });

        levelConfig.targetHoles.forEach((thConfig, index) => {
            const holeDiv = document.createElement('div');
            holeDiv.classList.add('hole', 'target-hole');
            holeDiv.dataset.id = `target-${index}`;
            holeDiv.dataset.element = thConfig.element;
            holeDiv.style.left = thConfig.x;
            holeDiv.style.top = thConfig.y;

            const capacityText = document.createElement('span');
            capacityText.classList.add('hole-capacity');
            holeDiv.appendChild(capacityText);
            
            gameBoard.appendChild(holeDiv);
            const targetHole = {
                id: `target-${index}`,
                element: thConfig.element,
                div: holeDiv,
                baseCapacity: thConfig.capacity, 
                currentCapacity: thConfig.capacity, 
                currentPeople: [],
                capacityTextEl: capacityText,
                generationInput: thConfig.generationInput || null, 
                originalPosition: {x: thConfig.x, y: thConfig.y} 
            };
            gameState.targetHoles.push(targetHole);
            updateTargetHoleDisplay(targetHole);
        });

        levelConfig.obstacles.forEach((obConfig, index) => {
            const obstacleInfo = OBSTACLE_TYPES[obConfig.type];
            if (!obstacleInfo) {
                console.warn("Unknown obstacle type in level config:", obConfig.type);
                return;
            }
            const obsDiv = document.createElement('div');
            obsDiv.classList.add('obstacle', obstacleInfo.id.toLowerCase().replace(/_/g, '-'));
            obsDiv.dataset.id = `obstacle-${index}`;
            obsDiv.dataset.type = obConfig.type;
            obsDiv.style.left = obConfig.x;
            obsDiv.style.top = obConfig.y;

            gameBoard.appendChild(obsDiv);
            gameState.obstacles.push({
                id: `obstacle-${index}`,
                type: obConfig.type,
                element: obstacleInfo.element, 
                clearedBy: obstacleInfo.clearedBy, 
                div: obsDiv
            });
        });

        // Initialize Tunnels
        if (levelConfig.tunnels) {
            levelConfig.tunnels.forEach((tConfig, index) => {
                const entryDiv = document.createElement('div');
                entryDiv.classList.add('tunnel-entry');
                entryDiv.dataset.id = `tunnel-entry-${tConfig.id}`;
                entryDiv.style.left = tConfig.entryX;
                entryDiv.style.top = tConfig.entryY;
                entryDiv.style.backgroundImage = `url('asset_gen/tunnel_entry.png')`;
                gameBoard.appendChild(entryDiv);

                const exitDiv = document.createElement('div');
                exitDiv.classList.add('tunnel-exit');
                exitDiv.dataset.id = `tunnel-exit-${tConfig.id}`;
                exitDiv.style.left = tConfig.exitX;
                exitDiv.style.top = tConfig.exitY;
                exitDiv.style.backgroundImage = `url('asset_gen/tunnel_exit.png')`;

                gameBoard.appendChild(exitDiv);

                gameState.tunnels.push({
                    id: tConfig.id,
                    entryDiv: entryDiv,
                    exitDiv: exitDiv,
                    entryPos: { x: tConfig.entryX, y: tConfig.entryY },
                    exitPos: { x: tConfig.exitX, y: tConfig.exitY },
                    transformTo: tConfig.transformTo || null
                });
            });
        }
        
        if (levelConfig.tutorial) {
            showTemporaryMessage(levelConfig.tutorial, 3500, true);
        }

        updateCollectionDisplay();
    }

    function replenishSourceHole(sourceHole, count = 1) {
        if (sourceHole.regenerationTimeout) clearTimeout(sourceHole.regenerationTimeout);
        let addedCount = 0;
        for (let i = 0; i < count; i++) {
            if (sourceHole.peopleCount < sourceHole.maxPeople) {
                createPerson(sourceHole.element, sourceHole);
                addedCount++;
            } else {
                break;
            }
        }
        
        if (sourceHole.peopleCount < sourceHole.maxPeople) {
           scheduleRegeneration(sourceHole);
        }
    }
    
    function scheduleRegeneration(sourceHole) {
        if (sourceHole.peopleCount < sourceHole.maxPeople && sourceHole.regenerationRate > 0 && !gameState.isLevelComplete) { 
            sourceHole.regenerationTimeout = setTimeout(() => {
                if (sourceHole.peopleCount < sourceHole.maxPeople) {
                    createPerson(sourceHole.element, sourceHole);
                }
                if (gameState.sourceHoles.find(sh => sh.id === sourceHole.id) && sourceHole.peopleCount < sourceHole.maxPeople) { 
                    scheduleRegeneration(sourceHole);
                }
            }, sourceHole.regenerationRate * (Math.random() * 0.5 + 0.75) );
        }
    }

    function createPerson(element, sourceHoleOrOrigin = null, specificPos = null, addToGameBoard = true) {
        const personDiv = document.createElement('div');
        personDiv.classList.add('person');
        personDiv.dataset.element = element;
        personDiv.style.backgroundImage = `url('${WUXING[element].personImg}')`;
        
        const person = {
            id: `person-${Date.now()}-${Math.random()}`,
            element: element, 
            div: personDiv,
            originHole: sourceHoleOrOrigin, 
            isMystery: element === 'MYSTERY',
        };
        gameState.people.push(person);

        if (sourceHoleOrOrigin && sourceHoleOrOrigin.div && sourceHoleOrOrigin.div.classList.contains('source-hole')) {
            sourceHoleOrOrigin.div.appendChild(personDiv); 
            sourceHoleOrOrigin.peopleCount++;
            // ... positioning logic ...
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * (parseInt(getComputedStyle(sourceHoleOrOrigin.div).width) / 4.5); 
            personDiv.style.position = 'absolute'; 
            personDiv.style.left = `calc(50% - ${parseInt(getComputedStyle(personDiv).width)/2}px + ${Math.cos(angle) * radius}px)`;
            personDiv.style.top = `calc(50% - ${parseInt(getComputedStyle(personDiv).height)/2}px + ${Math.sin(angle) * radius}px)`;
        } else if (specificPos) { 
            if (addToGameBoard) gameBoard.appendChild(personDiv);
            personDiv.style.left = specificPos.x;
            personDiv.style.top = specificPos.y;
        }
        return person;
    }

    function handleSourceMouseDown(event, sourceHole) {
        if (event.button !== 0) return; 
        if (gameState.draggingGroup || sourceHole.peopleCount === 0) return;

        gameState.draggingGroup = {
            leader: null,
            people: [],
            originHole: sourceHole,
            element: sourceHole.element, 
            offsetX: 0,
            offsetY: 0,
        };

        const peopleInSource = Array.from(sourceHole.div.querySelectorAll('.person'));
        if (peopleInSource.length === 0) {
            gameState.draggingGroup = null;
            return;
        }
        
        const boardRect = gameBoard.getBoundingClientRect();
        peopleInSource.forEach((personDivInstance, index) => {
            const p = gameState.people.find(pObj => pObj.div === personDivInstance);
            if (p) {
                gameState.draggingGroup.people.push(p);
                gameBoard.appendChild(p.div); 
                
                const initialRect = personDivInstance.getBoundingClientRect();
                p.div.style.left = `${initialRect.left - boardRect.left}px`;
                p.div.style.top = `${initialRect.top - boardRect.top}px`;
                p.div.classList.add('dragging');

                if (index === 0) { 
                    gameState.draggingGroup.leader = p;
                    const leaderRect = p.div.getBoundingClientRect();
                    gameState.draggingGroup.offsetX = event.clientX - (leaderRect.left + leaderRect.width / 2);
                    gameState.draggingGroup.offsetY = event.clientY - (leaderRect.top + leaderRect.height / 2);
                }
            }
        });
        
        sourceHole.peopleCount = 0; 
        if (sourceHole.peopleCount < sourceHole.maxPeople && !sourceHole.regenerationTimeout && sourceHole.regenerationRate > 0) {
             scheduleRegeneration(sourceHole);
        }

        document.addEventListener('mousemove', handleDrag);
        document.addEventListener('mouseup', handleDragEnd);
    }

    function handleDrag(event) {
        if (!gameState.draggingGroup) return;
        
        const boardRect = gameBoard.getBoundingClientRect();
        const leaderX = event.clientX - boardRect.left - gameState.draggingGroup.offsetX;
        const leaderY = event.clientY - boardRect.top - gameState.draggingGroup.offsetY;

        gameState.draggingGroup.leader.div.style.left = `${leaderX}px`;
        gameState.draggingGroup.leader.div.style.top = `${leaderY}px`;

        for (let i = 1; i < gameState.draggingGroup.people.length; i++) {
            const follower = gameState.draggingGroup.people[i];
            const prevPerson = gameState.draggingGroup.people[i-1];
            const targetX = parseFloat(prevPerson.div.style.left) - (Math.cos(i * 0.5) * parseInt(getComputedStyle(follower.div).width) * 0.5);
            const targetY = parseFloat(prevPerson.div.style.top) + (Math.sin(i * 0.5) * parseInt(getComputedStyle(follower.div).height) * 0.5) ;
            follower.div.style.left = `${targetX}px`;
            follower.div.style.top = `${targetY}px`;
        }
        
        const leaderRect = gameState.draggingGroup.leader.div.getBoundingClientRect();
        const leaderCenter = { x: leaderRect.left + leaderRect.width / 2, y: leaderRect.top + leaderRect.height / 2 };

        gameState.targetHoles.forEach(th => {
            const thRect = th.div.getBoundingClientRect();
            if (isOverlapping(leaderCenter, thRect)) {
                const isCorrectElementForDrop = th.element === gameState.draggingGroup.element || gameState.draggingGroup.element === 'MYSTERY';
                const canGenerate = th.generationInput && th.generationInput.sourceElement === gameState.draggingGroup.element;

                if ((isCorrectElementForDrop || canGenerate) && th.currentPeople.length < th.currentCapacity) {
                    th.div.classList.add('accepts-drag');
                    th.div.style.setProperty('--highlight-color', WUXING[gameState.draggingGroup.element === 'MYSTERY' ? th.element : gameState.draggingGroup.element].color);
                } else {
                    th.div.classList.remove('accepts-drag');
                }
            } else {
                th.div.classList.remove('accepts-drag');
            }
        });
    }

    function handleDragEnd(event) {
        document.removeEventListener('mousemove', handleDrag);
        document.removeEventListener('mouseup', handleDragEnd);

        if (!gameState.draggingGroup) return;

        const leader = gameState.draggingGroup.leader;
        const leaderRect = leader.div.getBoundingClientRect();
        const leaderCenter = { x: leaderRect.left + leaderRect.width / 2, y: leaderRect.top + leaderRect.height / 2 };
        const originalDraggedElement = gameState.draggingGroup.element; 

        let droppedInTarget = false;
        let peopleToReturn = [...gameState.draggingGroup.people]; 

        for (const th of gameState.targetHoles) {
            th.div.classList.remove('accepts-drag');
            const thRect = th.div.getBoundingClientRect();

            if (isOverlapping(leaderCenter, thRect)) {
                // ... (target hole drop logic remains largely the same) ...
                let currentDraggedElement = originalDraggedElement;
                
                if (originalDraggedElement === 'MYSTERY' && th.element !== 'MYSTERY') {
                    currentDraggedElement = th.element; 
                    gameState.draggingGroup.people.forEach(p => {
                        if (p.isMystery) { 
                            p.element = currentDraggedElement;
                            p.div.dataset.element = currentDraggedElement;
                            p.div.style.backgroundImage = `url('${WUXING[currentDraggedElement].personImg}')`;
                            p.isMystery = false; 
                        }
                    });
                    showTemporaryMessage(`Mystery revealed: ${WUXING[currentDraggedElement].name}!`, 1500);
                    playSound('wuxing_effect');
                }

                const isCorrectElement = th.element === currentDraggedElement;
                const canGenerate = th.generationInput && th.generationInput.sourceElement === currentDraggedElement && th.element !== currentDraggedElement;

                if (isCorrectElement || canGenerate) {
                    let countToDrop = gameState.draggingGroup.people.length;
                    let actuallyDroppedCount = 0;
                    
                    for (let i = 0; i < countToDrop; i++) {
                        if (th.currentPeople.length < th.currentCapacity) {
                            const personToDrop = peopleToReturn.shift(); 
                            if (!personToDrop) break; 

                            th.currentPeople.push(personToDrop);
                            personToDrop.div.remove(); 
                            const personIndex = gameState.people.findIndex(p => p.id === personToDrop.id);
                            if (personIndex > -1) gameState.people.splice(personIndex, 1);
                            actuallyDroppedCount++;
                        } else {
                            break; 
                        }
                    }

                    if (actuallyDroppedCount > 0) {
                        playSound('drop');
                        droppedInTarget = true;
                        updateTargetHoleDisplay(th);

                        if (canGenerate && th.generationInput) {
                            applyGenerationEffect(th, currentDraggedElement, actuallyDroppedCount);
                        }
                        
                        if (th.currentPeople.length >= th.currentCapacity) {
                            triggerUFOCollection(th);
                        }
                    }
                    // Ensure peopleToReturn reflects only those not dropped
                    // This break is important as a group can only be dropped in one hole
                    break; 
                }
            }
        }

        let currentElementForInteraction = (originalDraggedElement === 'MYSTERY' && gameState.draggingGroup.people[0] && !gameState.draggingGroup.people[0].isMystery) 
                                        ? gameState.draggingGroup.people[0].element 
                                        : originalDraggedElement;
        
        // Check for obstacle interaction IF not fully dropped in target hole or if some people remain
        if (peopleToReturn.length > 0 && currentElementForInteraction !== 'MYSTERY') { 
            for (const obstacle of gameState.obstacles) {
                const obsRect = obstacle.div.getBoundingClientRect();
                if (isOverlapping(leaderCenter, obsRect)) {
                    if (obstacle.clearedBy === currentElementForInteraction) {
                        showTemporaryMessage(`${WUXING[currentElementForInteraction].name} clears ${OBSTACLE_TYPES[obstacle.type].name}!`, 2000);
                        playSound('clear_obstacle');
                        playSound('wuxing_effect');
                        obstacle.div.remove();
                        gameState.obstacles = gameState.obstacles.filter(o => o.id !== obstacle.id);
                        
                        // Consume the group that cleared the obstacle
                        peopleToReturn.forEach(p => {
                            p.div.remove();
                            const personIndex = gameState.people.findIndex(gp => gp.id === p.id);
                            if (personIndex > -1) gameState.people.splice(personIndex, 1);
                        });
                        peopleToReturn = []; 
                        droppedInTarget = true; // To prevent return to source if obstacle cleared
                        break; 
                    }
                }
            }
        }

        // Check for tunnel interaction IF not fully dropped/cleared and people remain
        if (peopleToReturn.length > 0) {
            for (const tunnel of gameState.tunnels) {
                const entryRect = tunnel.entryDiv.getBoundingClientRect();
                if (isOverlapping(leaderCenter, entryRect)) {
                    playSound('wuxing_effect'); // Or a specific tunnel sound
                    const boardRect = gameBoard.getBoundingClientRect();
                    
                    peopleToReturn.forEach(p => {
                        p.div.remove(); // Remove old div
                        const personIndex = gameState.people.findIndex(gp => gp.id === p.id);
                        if (personIndex > -1) gameState.people.splice(personIndex, 1);

                        let newElement = p.element;
                        if (tunnel.transformTo && p.element !== 'MYSTERY') { // Don't transform mystery people this way
                            newElement = tunnel.transformTo;
                            showTemporaryMessage(`${WUXING[p.element].name} transformed to ${WUXING[newElement].name}!`, 1500);
                        }
                        
                        // Calculate exit position relative to gameBoard
                        const exitDivStyle = getComputedStyle(tunnel.exitDiv);
                        const exitXpx = parseFloat(exitDivStyle.left);
                        const exitYpx = parseFloat(exitDivStyle.top);
                        const exitWidth = parseFloat(exitDivStyle.width);
                        const exitHeight = parseFloat(exitDivStyle.height);

                        // Spawn near center of exit
                        const spawnX = `${exitXpx + exitWidth / 2 - 15 + (Math.random() * 20 - 10)}px`;
                        const spawnY = `${exitYpx + exitHeight / 2 - 15 + (Math.random() * 20 - 10)}px`;
                        
                        // Create a new person at the exit, it will be individually draggable
                        createPerson(newElement, null, { x: spawnX, y: spawnY });
                    });
                    peopleToReturn = []; // All people in group processed by tunnel
                    droppedInTarget = true; // To prevent return to source
                    break;
                }
            }
        }


        if (peopleToReturn.length > 0) {
            peopleToReturn.forEach(p => {
                p.div.classList.remove('dragging');
                if (p.isMystery && p.element !== 'MYSTERY') { 
                    p.element = 'MYSTERY';
                    p.div.dataset.element = 'MYSTERY';
                    p.div.style.backgroundImage = `url('${WUXING.MYSTERY.personImg}')`;
                }

                gameState.draggingGroup.originHole.div.appendChild(p.div); 
                gameState.draggingGroup.originHole.peopleCount++;
                const angle = Math.random() * Math.PI * 2;
                const radius = Math.random() * (parseInt(getComputedStyle(gameState.draggingGroup.originHole.div).width) / 4.5);
                p.div.style.position = 'absolute'; 
                p.div.style.left = `calc(50% - ${parseInt(getComputedStyle(p.div).width)/2}px + ${Math.cos(angle) * radius}px)`;
                p.div.style.top = `calc(50% - ${parseInt(getComputedStyle(p.div).height)/2}px + ${Math.sin(angle) * radius}px)`;
            });
            const originHole = gameState.draggingGroup.originHole;
            if (originHole.peopleCount < originHole.maxPeople && !originHole.regenerationTimeout && originHole.regenerationRate > 0) {
                scheduleRegeneration(originHole);
            }
        }
        
        gameState.draggingGroup.people.forEach(p => p.div.classList.remove('dragging')); 
        gameState.draggingGroup = null;
    }

    function applyGenerationEffect(targetHole, sourceElementUsed, countDropped) {
        const rule = targetHole.generationInput;
        if (!rule || rule.sourceElement !== sourceElementUsed) return;

        playSound('wuxing_effect');
        targetHole.div.classList.add('interaction-pulse');
        targetHole.div.style.setProperty('--highlight-color', WUXING[sourceElementUsed].color);
        setTimeout(() => targetHole.div.classList.remove('interaction-pulse'), 800);

        switch (rule.effectType) {
            case 'SPAWN_AT_SOURCE':
                // ... existing code ...
                break;
            case 'TEMP_CAPACITY_INCREASE':
                // ... existing code ...
                break;
            case 'SPAWN_NEAR_HOLE':
                // ... existing code ...
                break;
            case 'SOURCE_REGEN_BOOST':
                const targetSrcHole = gameState.sourceHoles.find(sh => sh.element === rule.targetSourceElement);
                if (targetSrcHole && rule.duration && rule.multiplier) {
                    if (!targetSrcHole.originalRegenerationRate) { // Avoid multiple boosts stacking poorly
                        targetSrcHole.originalRegenerationRate = targetSrcHole.regenerationRate;
                    }
                    targetSrcHole.regenerationRate = targetSrcHole.originalRegenerationRate * rule.multiplier;
                    
                    // Clear existing regeneration timeout and schedule a new one immediately with boosted rate
                    if (targetSrcHole.regenerationTimeout) clearTimeout(targetSrcHole.regenerationTimeout);
                    scheduleRegeneration(targetSrcHole); // Start new regen cycle

                    showTemporaryMessage(`${WUXING[rule.sourceElement].name} boosts ${WUXING[rule.targetSourceElement].name} source! Regen faster!`, 2500);

                    setTimeout(() => {
                        if (targetSrcHole.originalRegenerationRate) {
                            targetSrcHole.regenerationRate = targetSrcHole.originalRegenerationRate;
                            delete targetSrcHole.originalRegenerationRate;
                             // Clear existing regeneration timeout and schedule a new one with normal rate
                            if (targetSrcHole.regenerationTimeout) clearTimeout(targetSrcHole.regenerationTimeout);
                            scheduleRegeneration(targetSrcHole);
                        }
                    }, rule.duration);
                }
                break;
        }
    }
    
    function updateTargetHoleDisplay(targetHole) {
        targetHole.capacityTextEl.textContent = `${targetHole.currentPeople.length} / ${targetHole.currentCapacity}`;
        if (targetHole.currentPeople.length >= targetHole.currentCapacity) {
            targetHole.div.classList.add('full');
        } else {
            targetHole.div.classList.remove('full');
        }
    }

    function triggerUFOCollection(targetHole) {
        if (targetHole.collecting) return; 
        targetHole.collecting = true;
        playSound('collect');

        const ufoStartPos = { x: gameBoard.clientWidth / 2 - ufoElement.clientWidth / 2, y: -ufoElement.clientHeight }; 
        const holeRect = targetHole.div.getBoundingClientRect();
        const boardRect = gameBoard.getBoundingClientRect();
        const ufoTargetX = holeRect.left - boardRect.left + (holeRect.width / 2) - (ufoElement.clientWidth / 2);
        const ufoTargetY = holeRect.top - boardRect.top - ufoElement.clientHeight; 

        ufoContainer.style.display = 'block';
        ufoElement.style.transform = `translate(${ufoStartPos.x}px, ${ufoStartPos.y}px)`;
        ufoElement.style.opacity = '1';

        setTimeout(() => {
            ufoElement.style.transition = 'transform 1s ease-in-out';
            ufoElement.style.transform = `translate(${ufoTargetX}px, ${ufoTargetY}px)`;
        }, 50);

        setTimeout(() => {
            ufoElement.classList.add('collecting'); 
            const collectedAmount = targetHole.currentPeople.length;
            gameState.collectedCounts[targetHole.element] = (gameState.collectedCounts[targetHole.element] || 0) + collectedAmount;
            
            targetHole.currentPeople = []; 
            targetHole.currentCapacity = targetHole.baseCapacity; 
            updateTargetHoleDisplay(targetHole);
            updateCollectionDisplay();
            
            showTemporaryMessage(`Collected ${collectedAmount} ${WUXING[targetHole.element].name}!`, 1500);

            const collectionSlotEl = collectionBay.querySelector(`.collection-slot[data-element="${targetHole.element}"]`);
            let ufoEndX, ufoEndY;
            if (collectionSlotEl) {
                const slotRect = collectionSlotEl.getBoundingClientRect();
                ufoEndX = slotRect.left - boardRect.left + (slotRect.width / 2) - (ufoElement.clientWidth / 2);
                ufoEndY = slotRect.top - boardRect.top - ufoElement.clientHeight - 10; 
            } else { 
                ufoEndX = ufoStartPos.x; 
                ufoEndY = ufoStartPos.y;
            }
            
            setTimeout(() => {
                 ufoElement.style.transform = `translate(${ufoEndX}px, ${ufoEndY}px)`;
            }, 500); 

            setTimeout(() => {
                ufoElement.style.opacity = '0';
                setTimeout(() => {
                    ufoContainer.style.display = 'none';
                    ufoElement.classList.remove('collecting');
                    targetHole.collecting = false;
                    checkLevelComplete();
                }, 500);
            }, 1500); 
        }, 1050); 
    }
    
    function updateCollectionDisplay() {
        for (const el in gameState.collectionGoals) {
            const slot = collectionBay.querySelector(`.collection-slot[data-element="${el}"]`);
            if (slot) {
                const countEl = slot.querySelector('.count');
                const currentCollected = gameState.collectedCounts[el] || 0;
                countEl.textContent = `${currentCollected} / ${gameState.collectionGoals[el]}`;
                if (currentCollected >= gameState.collectionGoals[el]) {
                    slot.classList.add('complete');
                } else {
                    slot.classList.remove('complete');
                }
            }
        }
    }

    function checkLevelComplete() {
        if (gameState.isLevelComplete) return;
        let allGoalsMet = true;
        for (const el in gameState.collectionGoals) {
            if ((gameState.collectedCounts[el] || 0) < gameState.collectionGoals[el]) {
                allGoalsMet = false;
                break;
            }
        }
        if (allGoalsMet) {
            gameState.isLevelComplete = true;
            gameState.sourceHoles.forEach(sh => {
                 if(sh.regenerationTimeout) clearTimeout(sh.regenerationTimeout);
                 sh.regenerationTimeout = null;
            });
            showTemporaryMessage("Level Complete!", 3000, true);
            levelCompleteMessageEl.classList.remove('hidden');
            levelCompleteMessageEl.querySelector('h2').textContent = "Level Complete!";
            levelCompleteMessageEl.querySelector('p').textContent = "五行归位!";
            nextLevelButton.textContent = "Next Level";
            nextLevelButton.onclick = () => {
                levelCompleteMessageEl.classList.add('hidden');
                initLevel(gameState.level + 1);
            };
        }
    }

    function isOverlapping(point, rect) { 
        return point.x >= rect.left && point.x <= rect.right &&
               point.y >= rect.top && point.y <= rect.bottom;
    }

    function showTemporaryMessage(message, duration = 2000, important = false) {
        tempMessageEl.textContent = message;
        tempMessageEl.classList.remove('hidden');
        if (important) tempMessageEl.style.backgroundColor = 'var(--color-fire)';
        else tempMessageEl.style.backgroundColor = 'rgba(0,0,0,0.7)';
        
        if (tempMessageEl.timeoutId) {
            clearTimeout(tempMessageEl.timeoutId);
        }
        tempMessageEl.timeoutId = setTimeout(() => {
            tempMessageEl.classList.add('hidden');
            tempMessageEl.timeoutId = null;
        }, duration);
    }
    
    resetLevelButton.addEventListener('click', () => {
        if (audioContext && audioContext.state === 'suspended') {
            audioContext.resume(); 
        }
        initLevel(gameState.level)
    });
    document.body.addEventListener('mousedown', () => { 
        if (audioContext && audioContext.state === 'suspended') {
            audioContext.resume();
        }
    }, { once: true });

    initLevel(0); 
});