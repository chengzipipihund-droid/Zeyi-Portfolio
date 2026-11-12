// /portfolio — the prototypes that can be tried on the site, and the guided tour of each one.
// A step = one design decision: what you are looking at, why it is built this way, and one thing to try.
// `scene` is the state the prototype is put in when the step opens; `done` are the prototype events that count as
// "tried"; `hot` are the data-tour ids outlined while the step is open.
// Copy: hand-written for this page (Zeyi to review). TODO(zeyi): confirm the `role` lines.

export type L = { en: string; zh: string };
export type Lang = keyof L;

export interface TourStep {
  id: string;
  scene: string;
  title: L;
  what: L;
  why: L;
  try?: L;
  done: string[];
  hot: string[];
}

export interface Prototype {
  slug: 'seatrial-explorer' | 'floatopia';
  /** data-theme slug of the site (accent colour of the title). */
  theme: string;
  kind: 'desktop' | 'phone';
  title: string;
  label: L;
  tagline: L;
  summary: L;
  role: L;
  highlights: L[];
  minutes: number;
  cover: { src: string; w: number; h: number; alt: string };
  caseHref?: string;
  steps: TourStep[];
}

export const prototypes: Prototype[] = [
  {
    slug: 'seatrial-explorer',
    theme: 'seatrial',
    kind: 'desktop',
    title: 'SeaTrial Explorer',
    label: { en: 'Desktop web · B2B pre-sales · marine', zh: '桌面端 Web · B2B 售前工具 · 船舶' },
    tagline: { en: 'A sea trial before the steel is cut', zh: '钢板切割之前，先做一次试航' },
    summary: {
      en: 'A sales engineer and a ship owner compare two propulsion set-ups in the same harbour manoeuvre, on one clock, and see what the difference is worth.',
      zh: '销售工程师和船东在同一个港口操纵里，用同一条时间轴比较两套推进方案，并把差距换算成运营成本。',
    },
    role: { en: 'UX / UI design · interaction logic · coded prototype', zh: 'UX / UI 设计 · 交互逻辑 · 代码原型' },
    highlights: [
      { en: 'Scrub one timeline and watch two ships leave the berth', zh: '拖动一条时间轴，两艘船同时离泊' },
      { en: 'Three harbours with crabbing and swing manoeuvres', zh: '三个港口：横移离泊与掉头操纵' },
      { en: 'Turn the seconds saved into fuel cost per year', zh: '把节省的秒数换算成每年的燃油成本' },
    ],
    minutes: 2,
    cover: { src: '/prototypes/seatrial/cover.webp', w: 1440, h: 810, alt: 'SeaTrial Explorer, Compare view: two harbour charts side by side above a shared timeline' },
    caseHref: '/work/seatrial-explorer',
    steps: [
      {
        id: 'harbour',
        scene: 'harbour',
        title: { en: 'Start from the customer’s harbour', zh: '从客户的港口开始' },
        what: {
          en: 'Three harbours, each with a standard manoeuvre and results already computed for both set-ups.',
          zh: '三个港口，各对应一个标准操纵；两套方案的结果都已预先算好。',
        },
        why: {
          en: 'One simulator run needs an expert and days of waiting. Reading results from a library turns a study into a conversation, and a fixed manoeuvre keeps the comparison fair.',
          zh: '一次仿真要专家操作、等上好几天。改成从结果库里读取，一项“研究”就变成了一次对话；固定的标准操纵也保证了比较的公平。',
        },
        try: { en: 'Open “Harbour · manoeuvre” and pick another harbour.', zh: '点开「Harbour · manoeuvre」，换一个港口。' },
        done: ['harbour'],
        hot: ['st-harbour'],
      },
      {
        id: 'clock',
        scene: 'clock',
        title: { en: 'One clock for both ships', zh: '两艘船，一条时间轴' },
        what: {
          en: 'A and B replay side by side from the same start. One playhead drives both charts.',
          zh: 'A、B 从同一起点并排回放，一个播放头同时驱动两张海图。',
        },
        why: {
          en: 'The old workflow sent two screen recordings, each on its own clock, and nobody could line them up. With a shared clock the gap at any second is visible before a single number is read.',
          zh: '过去的做法是发两段各走各时间的录屏，没人对得上。共用一条时间轴后，任何一秒的差距都能直接看出来，不必先读数字。',
        },
        try: { en: 'Drag the timeline, or press play.', zh: '拖动时间轴，或按播放。' },
        done: ['scrub', 'play'],
        hot: ['st-timeline'],
      },
      {
        id: 'hulls',
        scene: 'hulls',
        title: { en: 'A replay you can read as a still', zh: '暂停时也读得懂的回放' },
        what: {
          en: 'A hull outline every 30 seconds shows where the ship was and which way it pointed.',
          zh: '每 30 秒留下一个船体轮廓，显示船当时的位置和朝向。',
        },
        why: {
          en: 'Crabbing is sideways motion, and a track line alone hides the heading. Ghost hulls keep the manoeuvre readable when the replay is paused and when it is printed in the report.',
          zh: '横移是侧向运动，只画轨迹线看不出船头朝向。船体残影让操纵过程在暂停时、在打印出来的报告里都看得明白。',
        },
        try: { en: 'Change the hull interval, then switch Split to Overlay.', zh: '改一下船体间隔，再把 Split 切到 Overlay。' },
        done: ['ghost', 'layout'],
        hot: ['st-ghost', 'st-layout'],
      },
      {
        id: 'explain',
        scene: 'explain',
        title: { en: 'Say why, not only what', zh: '不只展示结果，还要说明原因' },
        what: {
          en: 'Events sit on the timeline, the chart names the mode the Gate Rudder is in, and wind, waves and current are drawn as instruments.',
          zh: '事件标在时间轴上，海图标出 Gate Rudder 当前所处的模式，风、浪、流用仪表的形式画在图上。',
        },
        why: {
          en: 'The owner will ask why B is ahead at this moment. The sales engineer should be able to answer from the screen, without the hydrodynamics expert in the room.',
          zh: '船东一定会问“为什么这时候 B 更快”。销售工程师应该能直接指着屏幕回答，而不需要水动力专家在场。',
        },
        try: { en: 'Click an event on the timeline to jump to it.', zh: '点击时间轴上的一个事件，跳到那一刻。' },
        done: ['event'],
        hot: ['st-events', 'st-explain'],
      },
      {
        id: 'verdict',
        scene: 'verdict',
        title: { en: 'A verdict that can go against us', zh: '一个可能对我方不利的结论' },
        what: {
          en: 'Each number carries its delta to A. Green is better and red is worse, whichever set-up it belongs to.',
          zh: '每个指标都带着相对 A 的差值。绿色代表更好，红色代表更差，不论它属于哪套方案。',
        },
        why: {
          en: 'In this harbour the proposal is faster but passes closer to the quay, and the screen says so. A pre-sales tool is only trusted when it also shows where the proposal loses. Fidelity is a glyph with its error band, never a colour.',
          zh: '在这个港口，提案方案更快，但离码头更近，界面如实标红。售前工具只有在也展示自家方案的短处时才会被信任。可信度用符号加误差带表示，不占用颜色。',
        },
        try: { en: 'Press Swap A/B and watch the deltas flip.', zh: '点 Swap A/B，看差值如何反转。' },
        done: ['swap'],
        hot: ['st-tiles', 'st-swap'],
      },
      {
        id: 'value',
        scene: 'value',
        title: { en: 'Seconds become euros', zh: '把秒换算成欧元' },
        what: {
          en: 'Value turns the time saved per manoeuvre into a slower crossing, less energy and a fuel figure per year.',
          zh: 'Value 页把每次操纵节省的时间，一步步换算成更低的航速、更少的能耗和每年的燃油费用。',
        },
        why: {
          en: 'Owners decide on operating cost, not on seconds. Each step shows its assumption so it can be argued with, and capex stays beside the result instead of being netted into one number.',
          zh: '船东按运营成本做决定，而不是按秒数。每一步都写明假设，方便当场质疑和修改；投资成本与收益并列展示，不合并成一个数字。',
        },
        try: { en: 'Change the crossing time and watch the chain update.', zh: '调整航程时间，看整条换算链跟着变化。' },
        done: ['assume'],
        hot: ['st-assume', 'st-chain'],
      },
    ],
  },
  {
    slug: 'floatopia',
    theme: 'floatopia',
    kind: 'phone',
    title: 'Floatopia',
    label: { en: 'Mobile app · consumer booking · AI features', zh: '移动端 App · C 端预约 · AI 功能' },
    tagline: { en: 'A sports park that follows its bookings', zh: '跟着预约数据变化的运动公园' },
    summary: {
      en: 'Booking app for a modular sports park on an elevated ring in Macao. People navigate by the architectural drawing, and weekly demand decides where the sport modules go.',
      zh: '澳门高线“星环”上一座模块化运动公园的预约应用。用户直接在建筑图纸上导航，每周的预约需求决定运动模块如何排布。',
    },
    role: { en: 'Architecture (team, 1st prize) · UX / UI and prototype (individual)', zh: '建筑设计（团队，一等奖）· UX / UI 与原型（个人）' },
    highlights: [
      { en: 'Travel the ring on the drawing and zoom into an island', zh: '在图纸上沿星环移动，放大进入一座浮岛' },
      { en: 'Open the building and book a climbing session', zh: '把建筑“拆开”，预约一节攀岩' },
      { en: 'Ask in a sentence; accept a swap when the layout changes', zh: '用一句话找场地；布局变化时接受换场建议' },
    ],
    minutes: 2,
    cover: { src: '/prototypes/floatopia/cover.webp', w: 402, h: 874, alt: 'Floatopia home screen: the ring drawing as a map with island pins' },
    steps: [
      {
        id: 'map',
        scene: 'home',
        title: { en: 'The drawing is the map', zh: '图纸就是地图' },
        what: {
          en: 'Home is the ring itself: six islands on an elevated running line, drawn as in the competition entry.',
          zh: '首页就是星环本身：高线跑道串起六座浮岛，画法和竞赛图纸一致。',
        },
        why: {
          en: 'Booking apps usually open with a list of venues, and people lose track of where things are. Here the place is the navigation, so finding a court and finding the way there are one step.',
          zh: '预约类应用通常以场馆列表开场，用户很快就不知道东西在哪。这里空间本身就是导航，找场地和找路是同一个动作。',
        },
        try: { en: 'Drag the map along the ring, or tap a dot on the red line.', zh: '沿星环拖动地图，或点击红线上的圆点。' },
        done: ['pan'],
        hot: ['fl-map', 'fl-mini'],
      },
      {
        id: 'zoom',
        scene: 'home',
        title: { en: 'Zoom in, don’t switch page', zh: '放大进去，而不是跳转页面' },
        what: {
          en: 'Choosing an island zooms the drawing into it before the island page appears.',
          zh: '选中一座浮岛时，图纸先放大到它，然后才出现浮岛页面。',
        },
        why: {
          en: 'Ring, island, floor, module: four levels of the building are the four levels of the app. The zoom carries the context across, so no breadcrumb is needed to know where you are.',
          zh: '星环、浮岛、楼层、模块：建筑的四个层级就是应用的四个层级。放大动效把上下文带了过去，不需要面包屑也知道自己在哪。',
        },
        try: { en: 'Tap the Sports pin or its card.', zh: '点击 Sports 标记或它的卡片。' },
        done: ['island'],
        hot: ['fl-pin-sports', 'fl-peek-sports'],
      },
      {
        id: 'open',
        scene: 'island',
        title: { en: 'Open the building', zh: '把建筑拆开看' },
        what: {
          en: 'The island opens into an exploded axonometric. The numbers on the drawing are the numbers in the list.',
          zh: '浮岛展开成爆炸轴测图，图上的编号与列表里的编号一一对应。',
        },
        why: {
          en: 'A venue name says little. Seeing the climbing hall under the ring, next to the lift, answers “how do I get there” before it is asked. One drawing works as map, filter and status.',
          zh: '场馆名称能传达的信息很少。看到攀岩馆就在环道下方、电梯旁边，“怎么过去”这个问题还没问就有了答案。一张图同时是地图、筛选器和状态显示。',
        },
        try: { en: 'Tap the expand button, then the numbered markers. Switch to Next for next week’s layout.', zh: '点展开按钮，再点图上的编号；切到 Next 看下周的布局。' },
        done: ['expand', 'marker', 'week'],
        hot: ['fl-expand', 'fl-markers', 'fl-week'],
      },
      {
        id: 'book',
        scene: 'sheet',
        title: { en: 'Book in one sheet', zh: '一个浮层里完成预约' },
        what: {
          en: 'Day, session, people and coach sit in one sheet over the drawing. Price and cancellation rule update in place.',
          zh: '日期、场次、人数和教练都在图纸上方的同一个浮层里，价格和取消规则即时更新。',
        },
        why: {
          en: 'Every extra page in a booking flow loses people. Availability is shown by fill and outline together, solid, pale or dashed, so it never depends on telling green from grey.',
          zh: '预约流程每多一页就多流失一批人。余量状态同时用填充和描边区分（实底、浅底、虚线），不依赖分辨绿色和灰色。',
        },
        try: { en: 'Pick a session, add a person, then book.', zh: '选一个场次，加一个人，然后预约。' },
        done: ['slot', 'book'],
        hot: ['fl-slots', 'fl-book'],
      },
      {
        id: 'loop',
        scene: 'booked',
        title: { en: 'Your booking shapes next week', zh: '你的预约会影响下周的布局' },
        what: {
          en: 'The confirmation shows what the booking did to the park: climbing is three bookings away from a third module.',
          zh: '确认页告诉你这次预约对公园的影响：攀岩再有 3 个预约，下周就会多出第三个模块。',
        },
        why: {
          en: 'This is the idea of the whole project: modules move every week to follow demand. Showing the threshold makes the loop between app and building visible, and gives a reason to book early.',
          zh: '这是整个项目的核心：模块每周跟着需求重新排布。把阈值展示出来，应用与建筑之间的闭环就看得见了，也给了用户提前预约的理由。',
        },
        done: [],
        hot: ['fl-impact'],
      },
      {
        id: 'ask',
        scene: 'ask',
        title: { en: 'Ask instead of filtering', zh: '直接问，而不是层层筛选' },
        what: {
          en: 'One sentence becomes four chips and three ranked options, each with its reason.',
          zh: '一句话被拆成四个条件标签和三个排好序的方案，每个方案都附带理由。',
        },
        why: {
          en: 'The assistant shows what it understood before it acts, explains its ranking in one line, and always leaves the map as a way out. There is no chat thread, because the answer is a choice, not a conversation.',
          zh: 'AI 先展示它理解到了什么再行动，用一句话解释排序依据，并始终保留“回到地图”的出口。没有做成聊天窗口，因为用户要的是一个选择，而不是一段对话。',
        },
        try: { en: 'Tap Hold on the best match.', zh: '在最佳匹配上点 Hold。' },
        done: ['hold'],
        hot: ['fl-intent', 'fl-hold'],
      },
      {
        id: 'swap',
        scene: 'swap',
        title: { en: 'When the layout takes your court', zh: '当布局调整占用了你的场地' },
        what: {
          en: 'An event closes a court. The app proposes the closest swap and shows the two other ways out.',
          zh: '一场活动占用了球场。应用给出最接近的换场方案，同时列出另外两条出路。',
        },
        why: {
          en: 'A system that rearranges space has to own the consequences. It proposes and the person decides: nothing changes until they choose, and silence ends in a refund, not in a moved booking.',
          zh: '一个会重新分配空间的系统，必须为后果负责。系统只提建议，由人来决定：用户不选择就什么都不变，不回应的结果是退款，而不是被悄悄改期。',
        },
        try: { en: 'Accept the swap, or keep your court.', zh: '接受换场，或保留原来的场地。' },
        done: ['swap'],
        hot: ['fl-offer'],
      },
    ],
  },
];

export const findPrototype = (slug: string) => prototypes.find((p) => p.slug === slug);

export const pageCopy = {
  kicker: { en: 'Prototypes', zh: '可交互原型' },
  title: { en: 'Prototypes you can use', zh: '可以亲手试用的原型' },
  lead: {
    en: 'Two projects rebuilt as working front-end prototypes. Follow the guided steps, about two minutes each, or explore on your own.',
    zh: '两个项目被重建成可以运行的前端原型。可以跟着引导一步步看，每个大约两分钟，也可以自由探索。',
  },
  note: {
    en: 'Built in React from the Figma files. Data is illustrative and nothing is sent to a server.',
    zh: '基于 Figma 设计稿用 React 实现。数据均为示意，不连接任何后端。',
  },
  open: { en: 'Open prototype', zh: '打开原型' },
  tryLabel: { en: 'What you can try', zh: '可以试什么' },
  steps: { en: 'steps', zh: '步' },
  minutes: { en: 'min', zh: '分钟' },
  guided: { en: 'Guided', zh: '引导' },
  free: { en: 'Explore', zh: '自由探索' },
  enterFullscreen: { en: 'Enter fullscreen', zh: '全屏展示' },
  exitFullscreen: { en: 'Exit fullscreen', zh: '退出全屏' },
  back: { en: 'Back', zh: '上一步' },
  next: { en: 'Next', zh: '下一步' },
  finish: { en: 'Explore freely', zh: '自由探索' },
  restart: { en: 'Restart', zh: '重新开始' },
  what: { en: 'What you see', zh: '你看到的' },
  why: { en: 'Why it works this way', zh: '为什么这样设计' },
  tryIt: { en: 'Try it', zh: '试一试' },
  tried: { en: 'Tried', zh: '已体验' },
  caseStudy: { en: 'Read the case study', zh: '查看完整案例' },
  all: { en: 'All prototypes', zh: '全部原型' },
  role: { en: 'My role', zh: '我的角色' },
  scope: { en: 'Illustrative data · no backend', zh: '示意数据 · 无后端' },
  freeHint: { en: 'Everything on screen is live. Use it as you would the product.', zh: '屏幕上的内容都可以操作，像使用真实产品一样试试看。' },
  nextProto: { en: 'Next prototype', zh: '下一个原型' },
  narrow: { en: 'Designed for a desktop screen. Open it on a computer to use it at full size.', zh: '这是桌面端产品，建议在电脑上打开，以完整尺寸体验。' },
} satisfies Record<string, L>;
