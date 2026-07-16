const cx = 350, cy = 350, R = 270;
const order = [9,1,2,3,4,5,6,7,8];

const arrowsFallback = {
  integr: { 1:7, 2:4, 3:6, 4:1, 5:8, 6:9, 7:5, 8:2, 9:3 },
  disint: { 1:4, 2:8, 3:9, 4:2, 5:7, 6:3, 7:1, 8:5, 9:6 }
};

const groups = {
  instinctif: [8,9,1],
  emotionnel: [2,3,4],
  mental: [5,6,7]
};

function groupOf(t){
  if (groups.instinctif.includes(t)) return "instinctif";
  if (groups.emotionnel.includes(t)) return "emotionnel";
  return "mental";
}

function groupOfTypeValue(value){
  const n = Number(value);
  return n >= 1 && n <= 9 ? groupOf(n) : null;
}

function polarPoint(index){
  const angle = (-90 + index * (360/9)) * (Math.PI/180);
  return { x: cx + R * Math.cos(angle), y: cy + R * Math.sin(angle) };
}

const points = {};
order.forEach((t,i)=>{ points[t] = polarPoint(i); });

const hexSeq = [1,4,2,8,5,7,1];
const triSeq = [3,6,9,3];

function pathFromSeq(seq){
  return seq.map((t, idx) => (idx===0 ? "M" : "L") + points[t].x.toFixed(2) + " " + points[t].y.toFixed(2)).join(" ");
}

document.getElementById("hexPath").setAttribute("d", pathFromSeq(hexSeq));
document.getElementById("triPath").setAttribute("d", pathFromSeq(triSeq));

const nodesLayer = document.getElementById("nodesLayer");
const arrowsLayer = document.getElementById("arrowsLayer");

const arrowEls = { integr:{}, disint:{} };

function makeArrow(from, to, cls){
  const p1 = points[from], p2 = points[to];
  const line = document.createElementNS("http://www.w3.org/2000/svg","line");
  line.setAttribute("x1", p1.x);
  line.setAttribute("y1", p1.y);
  line.setAttribute("x2", p2.x);
  line.setAttribute("y2", p2.y);
  line.setAttribute("class", "arrow " + cls);
  arrowsLayer.appendChild(line);
  return line;
}

for(const t of [1,2,3,4,5,6,7,8,9]){
  arrowEls.integr[t] = makeArrow(t, arrowsFallback.integr[t], "integr");
  arrowEls.disint[t] = makeArrow(t, arrowsFallback.disint[t], "disint");
}

function clearAllArrows(){
  document.querySelectorAll(".arrow").forEach(a => a.classList.remove("on"));
}

function showOnlyTypeArrows(t){
  clearAllArrows();
  arrowEls.integr[t]?.classList.add("on");
  arrowEls.disint[t]?.classList.add("on");
}

function makeNode(t){
  const g = document.createElementNS("http://www.w3.org/2000/svg","g");
  g.setAttribute("class","node " + groupOf(t));
  g.setAttribute("data-type", String(t));

  const p = points[t];

  const c = document.createElementNS("http://www.w3.org/2000/svg","circle");
  c.setAttribute("cx", p.x);
  c.setAttribute("cy", p.y);
  c.setAttribute("r", 28);

  const tx = document.createElementNS("http://www.w3.org/2000/svg","text");
  tx.setAttribute("x", p.x);
  tx.setAttribute("y", p.y + 1);
  tx.textContent = t;

  const lb = document.createElementNS("http://www.w3.org/2000/svg","text");
  lb.setAttribute("x", p.x);
  lb.setAttribute("y", p.y + 44);
  lb.setAttribute("class","label");
  lb.textContent = "";

  g.appendChild(c);
  g.appendChild(tx);
  g.appendChild(lb);

  g.addEventListener("click", ()=>selectType(t));
  nodesLayer.appendChild(g);
}

[1,2,3,4,5,6,7,8,9].forEach(makeNode);

const badgeNum = document.getElementById("badgeNum");
const centerEl = document.getElementById("center");
const fearEl = document.getElementById("fear");
const desireEl = document.getElementById("desire");
const compulsionEl = document.getElementById("compulsion");
const toIntegr = document.getElementById("toIntegr");
const toDisint = document.getElementById("toDisint");
const moveHealthText = document.getElementById("moveHealthText");
const moveStressText = document.getElementById("moveStressText");
const openFull = document.getElementById("openFull");
const typeBadge = document.getElementById("typeBadge");
const sidePanel = document.getElementById("sidePanel");

let sidePanelUpdateTimer = null;

function highlightKeyNodes(activeType, integrType, disintType){
  const active = Number(activeType);
  const keep = new Set([active, Number(integrType), Number(disintType)].filter((n) => n >= 1 && n <= 9));

  nodesLayer.querySelectorAll(".node").forEach((node) => {
    const nodeType = Number(node.getAttribute("data-type"));
    const isActive = nodeType === active;
    const isKey = keep.has(nodeType);
    node.classList.toggle("is-active", isActive);
    node.classList.toggle("is-key", !isActive && isKey);
    node.classList.toggle("is-dimmed", !isKey);
  });
}

function clearNodeHighlights(){
  nodesLayer.querySelectorAll(".node").forEach((node) => {
    node.classList.remove("is-active", "is-key", "is-dimmed");
  });
}

function pulseSidePanel(){
  if(!sidePanel) return;
  sidePanel.classList.remove("is-updating");
  // Force reflow so quick consecutive clicks replay the animation.
  void sidePanel.offsetWidth;
  sidePanel.classList.add("is-updating");
  if(sidePanelUpdateTimer) clearTimeout(sidePanelUpdateTimer);
  sidePanelUpdateTimer = setTimeout(() => {
    sidePanel.classList.remove("is-updating");
  }, 180);
}

let typesData = null;

async function loadData(){
  const res = await fetch("/assets/data/en/types.json");
  typesData = await res.json();
}
loadData().catch(()=>{});

function selectType(t){
  badgeNum.textContent = t;
  typeBadge?.setAttribute("data-group", groupOf(t));

  const data = typesData ? typesData[String(t)] : null;

  const it = data?.integr ?? arrowsFallback.integr[t];
  const dt = data?.disint ?? arrowsFallback.disint[t];

  centerEl.textContent = data?.center ?? "—";
  centerEl.setAttribute("data-group", groupOf(t));
  fearEl.textContent = data?.fear ?? "—";
  desireEl.textContent = data?.desire ?? "—";
  compulsionEl.textContent = data?.compulsion ?? "—";

  toIntegr.textContent = it;
  toDisint.textContent = dt;
  const integrGroup = groupOfTypeValue(it);
  const disintGroup = groupOfTypeValue(dt);
  if (integrGroup) toIntegr.setAttribute("data-group", integrGroup);
  else toIntegr.removeAttribute("data-group");
  if (disintGroup) toDisint.setAttribute("data-group", disintGroup);
  else toDisint.removeAttribute("data-group");

  moveHealthText.textContent = data?.integr_text ?? "—";
  moveStressText.textContent = data?.disint_text ?? "—";

  openFull.setAttribute("href", `/en/type.html?type=${t}`);
  openFull.setAttribute("aria-disabled","false");

  highlightKeyNodes(t, it, dt);
  showOnlyTypeArrows(t);
  pulseSidePanel();
}

document.getElementById("btnReset").addEventListener("click", ()=>{
  badgeNum.textContent = "—";
  typeBadge?.removeAttribute("data-group");
  clearNodeHighlights();
  centerEl.textContent = "—";
  centerEl.removeAttribute("data-group");
  fearEl.textContent = "—";
  desireEl.textContent = "—";
  compulsionEl.textContent = "—";
  toIntegr.textContent = "—";
  toDisint.textContent = "—";
  toIntegr.removeAttribute("data-group");
  toDisint.removeAttribute("data-group");
  moveHealthText.textContent = "—";
  moveStressText.textContent = "—";
  openFull.setAttribute("aria-disabled","true");
  clearAllArrows();
});

clearAllArrows();
