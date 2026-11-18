// One metre = one scene unit. Floors and route share these elevations.
export const LEVELS = Object.freeze({ courtyard: 4, ground: 5.2, upper: 10.4, lookout: 15.6, eye: 1.65 });
export const SETTINGS = Object.freeze({ version:'0.170.0', pixelRatio:1.65, mobilePixelRatio:1.3, shadowSize:2048, leafCount:72, cameraFov:49, panoramaFov:41.5 });
export const SEASONS = {
  spring:{ canopy:0xdcb4ad, secondary:0xa3b987, grass:0x9ca77d, sky:0xdfe8df, fog:0xd7e0d4, sun:0xfff2db, particle:0xf4c9c5, caption:'春 / PETALS IN THE MOUNTAIN AIR', alt:'春日中庭，浅粉花冠与新绿倒映在水里' },
  summer:{ canopy:0x72915e, secondary:0x91a66a, grass:0x849766, sky:0xd1e2e0, fog:0xc3d6ce, sun:0xfff3d4, particle:0x8ca964, caption:'夏 / A DEEPER SHADE OF GREEN', alt:'夏日中庭，浓绿树荫围绕浅池' },
  autumn:{ canopy:0xd39766, secondary:0xf0c274, grass:0xc1bca0, sky:0xf7f3eb, fog:0xeeeadd, sun:0xffedcb, particle:0xcb8954, caption:'秋 / A QUIET TURN OF GOLD', alt:'初秋中庭，枫树的暖色树冠映在浅池中' },
  winter:{ canopy:0xb4b8a8, secondary:0xcbd0bf, grass:0xbdc5b5, sky:0xdde5e4, fog:0xd0dcda, sun:0xf0f4f3, particle:0xf2f3eb, caption:'冬 / THE SOUND OF STILLNESS', alt:'冬日中庭，树枝、薄雪与安静的池水' }
};

// p: camera position; t: look target; anchor metadata powers every navigation UI.
export const WAYPOINTS = [
  {p:[38,23.65,68],t:[-8,10,-7],id:'approach',name:'山路',en:'The approach',caption:'林间的第一眼，山城静立在风里。',floor:1},
  {p:[25,16.65,59],t:[0,10,-9]},
  {p:[10,8.65,48],t:[0,10,-14]},
  {p:[0,5.65,43],t:[0,8,10]},
  {p:[0,5.65,36],t:[0,8,14],id:'bridge',name:'木桥',en:'The bridge',caption:'水面倒映屋檐，脚步落在旧木上。',floor:1},
  {p:[0,5.65,29],t:[0,6.2,16],id:'gate',name:'城门',en:'The gate',caption:'穿过朱红门扉，山风也慢了下来。',floor:1},
  {p:[0,5.65,24],t:[-6,5.8,24]},
  {p:[-6.5,5.65,23],t:[-11,5.8,23],id:'guard',name:'守卫室',en:'The guard room',caption:'门畔的灯笼，曾为归人留着光。',floor:1},
  {p:[0,5.65,22],t:[2,7,8]},
  {p:[0,5.65,16],t:[4,9,-5],id:'forecourt',name:'前庭',en:'The forecourt',caption:'老树、踏石与深檐，围出一方安静。',floor:1},
  {p:[0,5.65,13],t:[0,7,4]},
  {p:[0,6.85,10.4],t:[0,7,4],id:'entrance',name:'主殿',en:'The main hall',caption:'越过门槛，让眼睛适应木色里的微光。',floor:1},
  {p:[0,6.85,7],t:[-9,6.9,7]},
  {p:[-7,6.85,7],t:[-9,6.7,0],id:'corridor',name:'主回廊',en:'The timber corridor',caption:'回廊连接日常，也连接不同方向的光。',floor:1},
  {p:[-9,6.85,4],t:[-9,6.5,-3]},
  {p:[-6.6,6.5,-3.2],t:[-12.08,5.94,-9.03],id:'tea',name:'茶室',en:'The tea room',caption:'一盏茶的时间，听庭院里的风。',floor:1},
  {p:[-6.4,6.85,0],t:[1,6,-5]},
  {p:[-4,6.85,0],t:[1,6,-5],id:'garden',name:'中庭',en:'The inner garden',caption:'一池微光，把天空留在屋里。',floor:1},
  {p:[-4,6.85,-9.5],t:[1,6.7,-5]},
  {p:[4,6.85,-9.5],t:[8,6.8,-5]},
  {p:[4,6.85,-7.4],t:[9,6.7,-4]},
  {p:[6.5,6.85,-7.4],t:[10,6.7,-2]},
  {p:[9,6.85,-5],t:[11.8,6.15,-2.8],id:'study',name:'书斋',en:'The study',caption:'纸页之间，山色与庭影悄然入窗。',floor:1},
  {p:[10,6.85,-8],t:[10,6.5,-13]},
  {p:[10,6.85,-12],t:[12,6.9,-14],id:'armory',name:'兵具间',en:'The armory',caption:'旧甲与长弓，已经听过许多年的风。',floor:1},
  {p:[10,6.85,-16],t:[4,7,-18]},
  {p:[4.8,6.85,-16],t:[4.8,9,-22],id:'stairs',name:'天守楼梯',en:'The ascent',caption:'沿着木阶，一步一步，靠近天空。',floor:1},
  {p:[4.8,6.85,-17],t:[4.8,10,-24]},
  {p:[4.8,12.05,-24],t:[-4.8,12.2,-24],id:'upper',name:'上层回廊',en:'The upper gallery',caption:'檐下回望，来时的庭院变成一幅画。',floor:2},
  {p:[0,12.05,-24],t:[0,12,-33]},
  {p:[-4.8,12.05,-24],t:[-4.8,16,-17]},
  {p:[-4.8,17.25,-17],t:[0,17.5,-17]},
  {p:[0,17.25,-17],t:[1,13,18]},
  {p:[.8,17.25,-14.8],t:[1,10,40],id:'lookout',name:'望楼',en:'The lookout',caption:'在旅途的尽头，把目光交给远山。',floor:3}
];
