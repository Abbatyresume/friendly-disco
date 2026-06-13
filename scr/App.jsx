import { useState, useCallback, useEffect, useRef } from "react";
import * as THREE from "three";

// ─── GLYPHS & CONSTANTS ───────────────────────────────────────────────────────
const GLYPHS={wK:"♔",wQ:"♕",wR:"♖",wB:"♗",wN:"♘",wP:"♙",bK:"♚",bQ:"♛",bR:"♜",bB:"♝",bN:"♞",bP:"♟"};
const S={bg:"#0d1b2a",panel:"#132032",card:"#1a2d40",header:"#0f2336",accent:"#3a7bd5",text:"#e8f0f8",textSub:"#7a9ab8",border:"#1e3450",green:"#4caf50",red:"#e05050",gold:"#f0c040"};
const BTS={Cappuccino:{light:"#f0d9b5",dark:"#b58863"},Midnight:{light:"#8ca0c8",dark:"#2a3a6a"},Forest:{light:"#d9e8c8",dark:"#557744"},Rose:{light:"#f0d0d8",dark:"#b07888"}};
const AVATARS=[{id:1,emoji:"🧙",label:"Wizard",locked:false},{id:2,emoji:"🦁",label:"Lion",locked:false},{id:3,emoji:"🕵️",label:"Detective",locked:false},{id:4,emoji:"🏴‍☠️",label:"Pirate",locked:false},{id:5,emoji:"🤖",label:"Robot",locked:false},{id:6,emoji:"🧝",label:"Elf",locked:true},{id:7,emoji:"👽",label:"Alien",locked:true},{id:8,emoji:"🧛",label:"Vampire",locked:true},{id:9,emoji:"⚔️",label:"Knight",locked:true},{id:10,emoji:"🎃",label:"Pumpkin",locked:true},{id:11,emoji:"👑",label:"Queen",locked:true},{id:12,emoji:"🥷",label:"Ninja",locked:true}];
const FRIENDS=[{id:1,name:"alexander_g",rating:1842,rank:12,global:3421,puzzles:6201,active:true,flag:"🇺🇸",av:"A",badge:"👑"},{id:2,name:"marina_v",rating:1650,rank:88,global:8654,puzzles:4310,active:false,lastSeen:"2 min ago",flag:"🇷🇺",av:"M",badge:"🏅"},{id:3,name:"dkchess99",rating:1422,rank:245,global:18200,puzzles:2190,active:false,lastSeen:"1 hour ago",flag:"🇩🇪",av:"D",badge:"🛡"},{id:4,name:"priya_s",rating:1280,rank:512,global:31000,puzzles:980,active:false,lastSeen:"Yesterday",flag:"🇮🇳",av:"P",badge:null},{id:5,name:"lucas_br",rating:1105,rank:890,global:52000,puzzles:440,active:false,lastSeen:"3 days ago",flag:"🇧🇷",av:"L",badge:null}];
const GLOBAL_LB=[{rank:1,flag:"🇳🇴",name:"MagnusC",rating:3812,delta:+12},{rank:2,flag:"🇷🇺",name:"FabianoCar",rating:3780,delta:-5},{rank:3,flag:"🇺🇸",name:"HikaruN",rating:3751,delta:+8},{rank:4,flag:"🇨🇳",name:"DingLiren",rating:3744,delta:0},{rank:5,flag:"🇦🇿",name:"TeimourR",rating:3720,delta:+3},{rank:6,flag:"🇮🇳",name:"ArjunE",rating:3698,delta:+15},{rank:7,flag:"🇫🇷",name:"MaximV",rating:3684,delta:-2},{rank:8,flag:"🇩🇪",name:"VincentK",rating:3671,delta:+6},{rank:9,flag:"🇵🇱",name:"JanK",rating:3660,delta:-8},{rank:10,flag:"🇺🇸",name:"NiteMoves",rating:3650,delta:+20},{rank:11,flag:"🇧🇷",name:"LucasBr",rating:3621,delta:+4},{rank:12,flag:"🇷🇺",name:"AlexG",rating:3608,delta:-1}];

// ─── PUZZLES with real FEN positions ─────────────────────────────────────────
const PUZZLES=[
  {id:1,title:"Mate in 1",rating:800,theme:"Mate",description:"White to move — checkmate in 1!",
   fen:"r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq",
   solution:["h5f7"]},
  {id:2,title:"Win the Queen",rating:900,theme:"Fork",description:"White knight fork — win the queen!",
   fen:"r1bqkbnr/pppp1ppp/8/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq",
   solution:["f3g5"]},
  {id:3,title:"Back Rank Mate",rating:1000,theme:"Mate",description:"Rook to the back rank — checkmate!",
   fen:"6k1/5ppp/8/8/8/8/5PPP/R5K1 w - -",
   solution:["a1a8"]},
  {id:4,title:"Pin the Knight",rating:1100,theme:"Pin",description:"Pin the knight and win material!",
   fen:"r1bqk2r/pppp1ppp/2n2n2/4p3/1bB1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq",
   solution:["c1g5"]},
  {id:5,title:"Skewer the King",rating:1200,theme:"Skewer",description:"Skewer the king to win the rook!",
   fen:"4k3/8/4r3/8/8/4R3/8/4K3 w - -",
   solution:["e3e8"]},
  {id:6,title:"Queen Sacrifice",rating:1400,theme:"Sacrifice",description:"Sacrifice the queen for a won endgame!",
   fen:"r4rk1/ppp2ppp/2n5/3qp3/8/2NP4/PPP1QPPP/R4RK1 w - -",
   solution:["e2e5"]},
];

// ─── FEN PARSER ───────────────────────────────────────────────────────────────
function parseFen(fen){
  const b=Array(8).fill(null).map(()=>Array(8).fill(null));
  const pieceMap={k:"K",q:"Q",r:"R",b:"B",n:"N",p:"P"};
  const rows=fen.split(" ")[0].split("/");
  rows.forEach((row,r)=>{
    let c=0;
    for(const ch of row){
      if(ch>="1"&&ch<="8"){c+=parseInt(ch);}
      else{const pc=ch===ch.toUpperCase()?"w":"b";b[r][c]=pc+pieceMap[ch.toLowerCase()];c++;}
    }
  });
  return b;
}

// ─── CHESS ENGINE ─────────────────────────────────────────────────────────────
const inB=(r,c)=>r>=0&&r<8&&c>=0&&c<8,col=p=>p?p[0]:null,typ=p=>p?p[1]:null,FILES="abcdefgh";
const PV={P:100,N:320,B:330,R:500,Q:900,K:20000};
const PST={P:[[0,0,0,0,0,0,0,0],[50,50,50,50,50,50,50,50],[10,10,20,30,30,20,10,10],[5,5,10,25,25,10,5,5],[0,0,0,20,20,0,0,0],[5,-5,-10,0,0,-10,-5,5],[5,10,10,-20,-20,10,10,5],[0,0,0,0,0,0,0,0]],N:[[-50,-40,-30,-30,-30,-30,-40,-50],[-40,-20,0,0,0,0,-20,-40],[-30,0,10,15,15,10,0,-30],[-30,5,15,20,20,15,5,-30],[-30,0,15,20,20,15,0,-30],[-30,5,10,15,15,10,5,-30],[-40,-20,0,5,5,0,-20,-40],[-50,-40,-30,-30,-30,-30,-40,-50]],B:[[-20,-10,-10,-10,-10,-10,-10,-20],[-10,0,0,0,0,0,0,-10],[-10,0,5,10,10,5,0,-10],[-10,5,5,10,10,5,5,-10],[-10,0,10,10,10,10,0,-10],[-10,10,10,10,10,10,10,-10],[-10,5,0,0,0,0,5,-10],[-20,-10,-10,-10,-10,-10,-10,-20]],R:[[0,0,0,0,0,0,0,0],[5,10,10,10,10,10,10,5],[-5,0,0,0,0,0,0,-5],[-5,0,0,0,0,0,0,-5],[-5,0,0,0,0,0,0,-5],[-5,0,0,0,0,0,0,-5],[-5,0,0,0,0,0,0,-5],[0,0,0,5,5,0,0,0]],Q:[[-20,-10,-10,-5,-5,-10,-10,-20],[-10,0,0,0,0,0,0,-10],[-10,0,5,5,5,5,0,-10],[-5,0,5,5,5,5,0,-5],[0,0,5,5,5,5,0,-5],[-10,5,5,5,5,5,0,-10],[-10,0,5,0,0,0,0,-10],[-20,-10,-10,-5,-5,-10,-10,-20]],K:[[-30,-40,-40,-50,-50,-40,-40,-30],[-30,-40,-40,-50,-50,-40,-40,-30],[-30,-40,-40,-50,-50,-40,-40,-30],[-30,-40,-40,-50,-50,-40,-40,-30],[-20,-30,-30,-40,-40,-30,-30,-20],[-10,-20,-20,-20,-20,-20,-20,-10],[20,20,0,0,0,0,20,20],[20,30,10,0,0,10,30,20]]};
const initBoard=()=>{const b=Array(8).fill(null).map(()=>Array(8).fill(null));["R","N","B","Q","K","B","N","R"].forEach((p,i)=>{b[0][i]="b"+p;b[7][i]="w"+p;});for(let i=0;i<8;i++){b[1][i]="bP";b[6][i]="wP";}return b;};
function rawMv(board,r,c,ep,cr){const piece=board[r][c];if(!piece)return[];const pc=col(piece),opp=pc==="w"?"b":"w";const mv=[];const add=(nr,nc,ex={})=>{if(!inB(nr,nc)||col(board[nr][nc])===pc)return;mv.push({r:nr,c:nc,...ex});};const sl=(dr,dc)=>{let nr=r+dr,nc=c+dc;while(inB(nr,nc)){if(col(board[nr][nc])===pc)break;mv.push({r:nr,c:nc});if(board[nr][nc])break;nr+=dr;nc+=dc;}};const t=typ(piece);if(t==="P"){const dir=pc==="w"?-1:1,st=pc==="w"?6:1,pr=pc==="w"?0:7;if(inB(r+dir,c)&&!board[r+dir][c]){if(r+dir===pr)["Q","R","B","N"].forEach(p=>mv.push({r:r+dir,c,promo:pc+p}));else{mv.push({r:r+dir,c});if(r===st&&!board[r+dir*2][c])mv.push({r:r+dir*2,c});}}[-1,1].forEach(dc=>{const nr=r+dir,nc=c+dc;if(!inB(nr,nc))return;if(col(board[nr][nc])===opp){if(nr===pr)["Q","R","B","N"].forEach(p=>mv.push({r:nr,c:nc,promo:pc+p}));else mv.push({r:nr,c:nc});}if(ep&&nr===ep[0]&&nc===ep[1])mv.push({r:nr,c:nc,ep:true});});}if(t==="N")[[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]].forEach(([dr,dc])=>add(r+dr,c+dc));if(t==="B")[[-1,-1],[-1,1],[1,-1],[1,1]].forEach(([dr,dc])=>sl(dr,dc));if(t==="R")[[-1,0],[1,0],[0,-1],[0,1]].forEach(([dr,dc])=>sl(dr,dc));if(t==="Q")[[-1,-1],[-1,1],[1,-1],[1,1],[-1,0],[1,0],[0,-1],[0,1]].forEach(([dr,dc])=>sl(dr,dc));if(t==="K"){[[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]].forEach(([dr,dc])=>add(r+dr,c+dc));const row=pc==="w"?7:0;if(r===row&&c===4&&cr){if(cr[pc]?.k&&!board[row][5]&&!board[row][6]&&!atk(board,row,4,opp)&&!atk(board,row,5,opp)&&!atk(board,row,6,opp))mv.push({r:row,c:6,castle:"k"});if(cr[pc]?.q&&!board[row][3]&&!board[row][2]&&!board[row][1]&&!atk(board,row,4,opp)&&!atk(board,row,3,opp)&&!atk(board,row,2,opp))mv.push({r:row,c:2,castle:"q"});}}return mv;}
function atk(board,r,c,by){for(let fr=0;fr<8;fr++)for(let fc=0;fc<8;fc++){const p=board[fr][fc];if(col(p)!==by)continue;const t=typ(p);if(t==="P"){const d=by==="w"?-1:1;if(fr+d===r&&(fc-1===c||fc+1===c))return true;}if(t==="N"&&[[fr-2,fc-1],[fr-2,fc+1],[fr-1,fc-2],[fr-1,fc+2],[fr+1,fc-2],[fr+1,fc+2],[fr+2,fc-1],[fr+2,fc+1]].some(([nr,nc])=>nr===r&&nc===c))return true;if(t==="B"||t==="Q"){for(const[dr,dc]of[[-1,-1],[-1,1],[1,-1],[1,1]]){let nr=fr+dr,nc=fc+dc;while(inB(nr,nc)){if(nr===r&&nc===c)return true;if(board[nr][nc])break;nr+=dr;nc+=dc;}}}if(t==="R"||t==="Q"){for(const[dr,dc]of[[-1,0],[1,0],[0,-1],[0,1]]){let nr=fr+dr,nc=fc+dc;while(inB(nr,nc)){if(nr===r&&nc===c)return true;if(board[nr][nc])break;nr+=dr;nc+=dc;}}}if(t==="K"&&Math.abs(fr-r)<=1&&Math.abs(fc-c)<=1)return true;}return false;}
function apMv(board,from,to){const nb=board.map(r=>[...r]);nb[to.r][to.c]=to.promo||nb[from.r][from.c];nb[from.r][from.c]=null;if(to.ep)nb[from.r][to.c]=null;if(to.castle){const row=from.r;if(to.castle==="k"){nb[row][5]=nb[row][7];nb[row][7]=null;}else{nb[row][3]=nb[row][0];nb[row][0]=null;}}return nb;}
function findK(board,c){for(let r=0;r<8;r++)for(let cc=0;cc<8;cc++)if(board[r][cc]===c+"K")return[r,cc];return null;}
function inChk(board,c){const k=findK(board,c);return k?atk(board,k[0],k[1],c==="w"?"b":"w"):false;}
function legMv(board,r,c,ep,cr){const pc=col(board[r][c]);return rawMv(board,r,c,ep,cr).filter(m=>{const nb=apMv(board,{r,c},m);return!inChk(nb,pc);});}
function allLeg(board,pc,ep,cr){const mv=[];for(let r=0;r<8;r++)for(let c=0;c<8;c++){if(col(board[r][c])!==pc)continue;legMv(board,r,c,ep,cr).forEach(m=>mv.push({from:{r,c},to:m}));}return mv;}
function toAlg(board,from,mv){const t=typ(board[from.r][from.c]);const sq=FILES[mv.c]+(8-mv.r);if(mv.castle)return mv.castle==="k"?"O-O":"O-O-O";let pre=t==="P"?"":t;if(t==="P"&&board[mv.r][mv.c])pre=FILES[from.c];return pre+(board[mv.r][mv.c]||mv.ep?"x":"")+sq+(mv.promo?"="+typ(mv.promo):"");}
function evalB(board){let s=0;for(let r=0;r<8;r++)for(let c=0;c<8;c++){const p=board[r][c];if(!p)continue;const pc=col(p),t=typ(p);s+=(pc==="w"?1:-1)*(PV[t]+(PST[t]?pc==="w"?PST[t][r][c]:PST[t][7-r][c]:0));}return s;}
function mmx(board,depth,a,b,max,ep,cr){if(depth===0)return{score:evalB(board),move:null};const pc=max?"w":"b";const mvs=allLeg(board,pc,ep,cr);if(!mvs.length)return{score:inChk(board,pc)?(max?-99999:99999):0,move:null};mvs.sort((a,b)=>(board[b.to.r][b.to.c]?1:0)-(board[a.to.r][a.to.c]?1:0));let best=null,bs=max?-Infinity:Infinity;for(const m of mvs){const nb=apMv(board,m.from,m.to);const piece=board[m.from.r][m.from.c];const nep=typ(piece)==="P"&&Math.abs(m.to.r-m.from.r)===2?[m.to.r+(pc==="w"?1:-1),m.to.c]:null;const ncr={w:{...cr.w},b:{...cr.b}};if(typ(piece)==="K"){ncr[pc].k=false;ncr[pc].q=false;}if(typ(piece)==="R"){const row=pc==="w"?7:0;if(m.from.r===row&&m.from.c===7)ncr[pc].k=false;if(m.from.r===row&&m.from.c===0)ncr[pc].q=false;}const res=mmx(nb,depth-1,a,b,!max,nep,ncr);if(max){if(res.score>bs){bs=res.score;best=m;}a=Math.max(a,bs);}else{if(res.score<bs){bs=res.score;best=m;}b=Math.min(b,bs);}if(b<=a)break;}return{score:bs,move:best};}

// ─── ANALYSIS ─────────────────────────────────────────────────────────────────
function analyzeGame(history){
  return history.map((snap,i)=>{
    const prevScore=i>0?evalB(history[i-1].board):0;
    const currScore=evalB(snap.board);
    const mover=i%2===0?"w":"b";
    const delta=mover==="w"?(currScore-prevScore):(prevScore-currScore);
    let ann="";
    if(delta<-200)ann="??";else if(delta<-100)ann="?";else if(delta<-50)ann="?!";
    else if(delta>150)ann="!!";else if(delta>75)ann="!";
    return{alg:snap.alg,ann,score:currScore};
  });
}

// ─── SOUND ────────────────────────────────────────────────────────────────────
function useSound(on){const ctx=useRef(null);const g=()=>{if(!ctx.current)ctx.current=new(window.AudioContext||window.webkitAudioContext)();return ctx.current;};const play=(f,t,d,v=0.3)=>{if(!on)return;try{const a=g(),o=a.createOscillator(),gn=a.createGain();o.connect(gn);gn.connect(a.destination);o.type=t;o.frequency.setValueAtTime(f,a.currentTime);gn.gain.setValueAtTime(v,a.currentTime);gn.gain.exponentialRampToValueAtTime(0.001,a.currentTime+d);o.start();o.stop(a.currentTime+d);}catch(e){}};return{move:()=>play(440,"sine",0.08),capture:()=>{play(200,"sawtooth",0.15,0.4);setTimeout(()=>play(150,"sawtooth",0.1,0.2),80);},check:()=>{play(880,"square",0.1,0.4);setTimeout(()=>play(1100,"square",0.15,0.3),120);},castle:()=>{play(330,"sine",0.1);setTimeout(()=>play(550,"sine",0.15),200);},over:()=>{[440,350,280].forEach((f,i)=>setTimeout(()=>play(f,"sawtooth",0.3,0.4),i*200));},tick:()=>play(1000,"square",0.03,0.1),success:()=>{[523,659,784,1047].forEach((f,i)=>setTimeout(()=>play(f,"sine",0.2,0.4),i*100));},fail:()=>{play(220,"sawtooth",0.3,0.4);}
};}

// ─── TIMER ────────────────────────────────────────────────────────────────────
const INIT_T=10*60,fmt=s=>{const m=Math.floor(s/60),sec=s%60;return`${m}:${sec.toString().padStart(2,"0")}`;};
function useTimers(turn,paused){const[wT,setW]=useState(INIT_T);const[bT,setB]=useState(INIT_T);const[flag,setFlag]=useState(null);const ref=useRef(null);useEffect(()=>{if(paused||flag){clearInterval(ref.current);return;}clearInterval(ref.current);ref.current=setInterval(()=>{if(turn==="w")setW(t=>{if(t<=1){setFlag("w");return 0;}return t-1;});else setB(t=>{if(t<=1){setFlag("b");return 0;}return t-1;});},1000);return()=>clearInterval(ref.current);},[turn,paused,flag]);const reset=()=>{setW(INIT_T);setB(INIT_T);setFlag(null);clearInterval(ref.current);};return{wT,bT,flag,reset};}

// ─── MULTIPLAYER ──────────────────────────────────────────────────────────────
function useMP(){const[roomCode,setRC]=useState(null);const[myColor,setMC]=useState(null);const[opponent,setOpp]=useState(null);const[connected,setConn]=useState(false);const[waiting,setWait]=useState(false);const[incomingMove,setIM]=useState(null);const ch=useRef(null);const create=()=>{const code=Math.random().toString(36).slice(2,7).toUpperCase();setRC(code);setMC("w");setWait(true);setConn(false);const c=new BroadcastChannel("chess_"+code);ch.current=c;c.onmessage=(e)=>{if(e.data.type==="join"){setOpp(e.data.name||"Opponent");setConn(true);setWait(false);c.postMessage({type:"welcome",name:"Host"});}if(e.data.type==="move")setIM(e.data.move);if(e.data.type==="resign")setIM({type:"resign"});if(e.data.type==="draw_offer")setIM({type:"draw_offer"});if(e.data.type==="draw_accept")setIM({type:"draw_accept"});};return code;};const join=(code)=>{const c=new BroadcastChannel("chess_"+code.toUpperCase());ch.current=c;setRC(code.toUpperCase());setMC("b");setWait(true);c.postMessage({type:"join",name:"Guest"});c.onmessage=(e)=>{if(e.data.type==="welcome"){setOpp(e.data.name||"Host");setConn(true);setWait(false);}if(e.data.type==="move")setIM(e.data.move);if(e.data.type==="resign")setIM({type:"resign"});if(e.data.type==="draw_offer")setIM({type:"draw_offer"});if(e.data.type==="draw_accept")setIM({type:"draw_accept"});};};const send=(move)=>ch.current?.postMessage({type:"move",move});const sendResign=()=>ch.current?.postMessage({type:"resign"});const sendDrawOffer=()=>ch.current?.postMessage({type:"draw_offer"});const sendDrawAccept=()=>ch.current?.postMessage({type:"draw_accept"});const disconnect=()=>{ch.current?.close();ch.current=null;setRC(null);setMC(null);setOpp(null);setConn(false);setWait(false);};return{roomCode,myColor,opponent,connected,waiting,incomingMove,setIM,create,join,send,sendResign,sendDrawOffer,sendDrawAccept,disconnect};}

// ─── 3D BOARD ─────────────────────────────────────────────────────────────────
function buildPieceMesh(piece,isWhite){
  const t=typ(piece);
  const wCol=isWhite?0xf5efe0:0x1a1208;
  const wRough=isWhite?0.25:0.55;
  const wMetal=isWhite?0.5:0.2;
  const mat=()=>new THREE.MeshStandardMaterial({color:wCol,roughness:wRough,metalness:wMetal});
  const accentMat=new THREE.MeshStandardMaterial({color:isWhite?0xffd700:0xcc8800,roughness:0.2,metalness:0.8});
  const group=new THREE.Group();

  // Base disc for all pieces
  const base=new THREE.Mesh(new THREE.CylinderGeometry(0.38,0.42,0.1,20),mat());
  base.position.y=0.05;base.castShadow=true;group.add(base);

  if(t==="P"){
    const stem=new THREE.Mesh(new THREE.CylinderGeometry(0.18,0.28,0.5,14),mat());
    stem.position.y=0.35;stem.castShadow=true;group.add(stem);
    const head=new THREE.Mesh(new THREE.SphereGeometry(0.22,14,10),mat());
    head.position.y=0.72;head.castShadow=true;group.add(head);
  }
  else if(t==="R"){
    const body=new THREE.Mesh(new THREE.CylinderGeometry(0.28,0.32,0.7,16),mat());
    body.position.y=0.45;body.castShadow=true;group.add(body);
    const top=new THREE.Mesh(new THREE.CylinderGeometry(0.34,0.28,0.15,16),mat());
    top.position.y=0.87;top.castShadow=true;group.add(top);
    // battlements
    for(let i=0;i<4;i++){const ang=(i/4)*Math.PI*2;const bt=new THREE.Mesh(new THREE.BoxGeometry(0.12,0.18,0.12),mat());bt.position.set(Math.cos(ang)*0.24,1.0,Math.sin(ang)*0.24);bt.castShadow=true;group.add(bt);}
  }
  else if(t==="N"){
    const body=new THREE.Mesh(new THREE.CylinderGeometry(0.22,0.30,0.55,14),mat());
    body.position.y=0.37;body.castShadow=true;group.add(body);
    const neck=new THREE.Mesh(new THREE.CylinderGeometry(0.18,0.22,0.35,12),mat());
    neck.position.set(0.08,0.82,0);neck.rotation.z=-0.35;neck.castShadow=true;group.add(neck);
    const head=new THREE.Mesh(new THREE.SphereGeometry(0.22,12,10),mat());
    head.scale.set(0.9,1.1,0.7);head.position.set(0.16,1.08,0);head.castShadow=true;group.add(head);
    const snout=new THREE.Mesh(new THREE.SphereGeometry(0.12,10,8),mat());
    snout.position.set(0.30,1.0,0);snout.castShadow=true;group.add(snout);
    const ear=new THREE.Mesh(new THREE.ConeGeometry(0.06,0.14,8),mat());
    ear.position.set(0.1,1.28,0.08);ear.castShadow=true;group.add(ear);
  }
  else if(t==="B"){
    const body=new THREE.Mesh(new THREE.CylinderGeometry(0.15,0.30,0.75,14),mat());
    body.position.y=0.47;body.castShadow=true;group.add(body);
    const ball=new THREE.Mesh(new THREE.SphereGeometry(0.2,12,10),mat());
    ball.position.y=0.96;ball.castShadow=true;group.add(ball);
    const tip=new THREE.Mesh(new THREE.ConeGeometry(0.07,0.22,10),mat());
    tip.position.y=1.24;tip.castShadow=true;group.add(tip);
    const slash=new THREE.Mesh(new THREE.TorusGeometry(0.19,0.025,6,18,Math.PI),accentMat);
    slash.position.y=0.97;slash.rotation.x=0.3;group.add(slash);
  }
  else if(t==="Q"){
    const body=new THREE.Mesh(new THREE.CylinderGeometry(0.2,0.34,0.7,16),mat());
    body.position.y=0.45;body.castShadow=true;group.add(body);
    const waist=new THREE.Mesh(new THREE.SphereGeometry(0.22,14,10),mat());
    waist.position.y=0.9;waist.castShadow=true;group.add(waist);
    // Crown ring
    const ring=new THREE.Mesh(new THREE.TorusGeometry(0.24,0.06,8,20),accentMat);
    ring.position.y=1.12;ring.rotation.x=Math.PI/2;group.add(ring);
    // Crown spikes
    for(let i=0;i<5;i++){const ang=(i/5)*Math.PI*2;const spike=new THREE.Mesh(new THREE.ConeGeometry(0.05,0.22,8),accentMat);spike.position.set(Math.cos(ang)*0.24,1.28,Math.sin(ang)*0.24);group.add(spike);}
    const top=new THREE.Mesh(new THREE.SphereGeometry(0.1,10,8),accentMat);top.position.y=1.46;group.add(top);
  }
  else if(t==="K"){
    const body=new THREE.Mesh(new THREE.CylinderGeometry(0.22,0.36,0.72,16),mat());
    body.position.y=0.46;body.castShadow=true;group.add(body);
    const mid=new THREE.Mesh(new THREE.SphereGeometry(0.24,14,10),mat());
    mid.position.y=0.94;mid.castShadow=true;group.add(mid);
    // Crown band
    const band=new THREE.Mesh(new THREE.CylinderGeometry(0.26,0.26,0.18,20),accentMat);
    band.position.y=1.14;group.add(band);
    // Cross vertical
    const cv=new THREE.Mesh(new THREE.BoxGeometry(0.1,0.42,0.1),accentMat);
    cv.position.y=1.44;group.add(cv);
    // Cross horizontal
    const ch2=new THREE.Mesh(new THREE.BoxGeometry(0.34,0.1,0.1),accentMat);
    ch2.position.y=1.56;group.add(ch2);
  }
  return group;
}

function Board3D({board,selected,legalMoves,lastMove,onSquareClick,flipped,boardThemeName}){
  const mountRef=useRef(null);
  const refs=useRef({scene:null,renderer:null,cam:null,pieces:{},squares:[],frame:null,dragged:false,lm:{x:0,y:0},angle:{theta:flipped?Math.PI:0,phi:0.9}});

  const b2w=(r,c)=>{const fr=flipped?7-r:r,fc=flipped?7-c:c;return{x:(fc-3.5)*1.12,z:(fr-3.5)*1.12};};

  useEffect(()=>{
    const el=mountRef.current;if(!el)return;
    const W=el.clientWidth||300,H=el.clientHeight||300;
    const R=refs.current;
    const scene=new THREE.Scene();scene.background=new THREE.Color(0x0d1b2a);scene.fog=new THREE.FogExp2(0x0d1b2a,0.045);
    R.scene=scene;
    const cam=new THREE.PerspectiveCamera(42,W/H,0.1,80);R.cam=cam;
    const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
    renderer.setSize(W,H);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    el.appendChild(renderer.domElement);R.renderer=renderer;

    // Lights
    scene.add(new THREE.AmbientLight(0xffeedd,0.55));
    const dl=new THREE.DirectionalLight(0xfff5e0,1.4);dl.position.set(5,10,5);dl.castShadow=true;dl.shadow.mapSize.set(2048,2048);dl.shadow.camera.near=0.5;dl.shadow.camera.far=30;dl.shadow.camera.left=-6;dl.shadow.camera.right=6;dl.shadow.camera.top=6;dl.shadow.camera.bottom=-6;scene.add(dl);
    scene.add(Object.assign(new THREE.DirectionalLight(0xaaccff,0.35),{position:new THREE.Vector3(-4,6,-4)}));
    scene.add(Object.assign(new THREE.PointLight(0xffddaa,0.5,20),{position:new THREE.Vector3(0,8,0)}));

    // Board base
    const base=new THREE.Mesh(new THREE.BoxGeometry(10,0.35,10),new THREE.MeshStandardMaterial({color:0x3d2008,roughness:0.85,metalness:0.1}));
    base.position.y=-0.18;base.receiveShadow=true;scene.add(base);
    const trim=new THREE.Mesh(new THREE.BoxGeometry(10.1,0.06,10.1),new THREE.MeshStandardMaterial({color:0xc8903a,roughness:0.3,metalness:0.4}));
    trim.position.y=0.03;scene.add(trim);

    // Squares
    R.squares=[];
    const BT=BTS[boardThemeName]||BTS.Cappuccino;
    for(let r=0;r<8;r++)for(let c=0;c<8;c++){
      const light=(r+c)%2===0;
      const geo=new THREE.BoxGeometry(1.1,0.1,1.1);
      const mat=new THREE.MeshStandardMaterial({color:light?BT.light:BT.dark,roughness:0.55,metalness:0.05});
      const mesh=new THREE.Mesh(geo,mat);
      const{x,z}=b2w(r,c);mesh.position.set(x,0.05,z);mesh.receiveShadow=true;
      mesh.userData={r,c,light};scene.add(mesh);R.squares.push(mesh);
    }

    // Coord labels
    const labelCanvas=(text,fg)=>{const cv=document.createElement("canvas");cv.width=64;cv.height=64;const ctx=cv.getContext("2d");ctx.fillStyle=fg;ctx.font="bold 40px Arial";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(text,32,32);return new THREE.CanvasTexture(cv);};
    const labelMat=(text,fg)=>new THREE.MeshBasicMaterial({map:labelCanvas(text,fg),transparent:true,opacity:0.7});
    const fls=flipped?"hgfedcba":"abcdefgh",rks=flipped?"12345678":"87654321";
    for(let i=0;i<8;i++){
      const fi=FILES[flipped?7-i:i],ri=rks[i];
      const fg=(i%2===0)?(BTS[boardThemeName]||BTS.Cappuccino).light:(BTS[boardThemeName]||BTS.Cappuccino).dark;
      const fm=new THREE.Mesh(new THREE.PlaneGeometry(0.4,0.4),labelMat(fi,"#666644"));
      fm.rotation.x=-Math.PI/2;fm.position.set((i-3.5)*1.12,0.11,(4)*1.12-0.25);scene.add(fm);
      const rm=new THREE.Mesh(new THREE.PlaneGeometry(0.4,0.4),labelMat(ri,"#664444"));
      rm.rotation.x=-Math.PI/2;rm.position.set(-(4)*1.12+0.25,0.11,(i-3.5)*1.12);scene.add(rm);
    }

    // Camera
    const updateCam=()=>{const{theta,phi}=R.angle;const dist=10.5;cam.position.set(dist*Math.sin(theta)*Math.cos(phi),dist*Math.sin(phi),dist*Math.cos(theta)*Math.cos(phi));cam.lookAt(0,0.5,0);};
    updateCam();

    // Animate
    const tick=()=>{R.frame=requestAnimationFrame(tick);renderer.render(scene,cam);};tick();

    // Controls
    const onDown=(e)=>{R.dragged=false;const pt=e.touches?e.touches[0]:e;R.lm={x:pt.clientX,y:pt.clientY};R.down=true;};
    const onUp=()=>{R.down=false;};
    const onMove=(e)=>{if(!R.down)return;const pt=e.touches?e.touches[0]:e;const dx=(pt.clientX-R.lm.x)*0.007,dy=(pt.clientY-R.lm.y)*0.006;if(Math.abs(dx)>0.001||Math.abs(dy)>0.001)R.dragged=true;R.angle.theta-=dx;R.angle.phi=Math.max(0.28,Math.min(1.38,R.angle.phi+dy));R.lm={x:pt.clientX,y:pt.clientY};updateCam();};
    const raycaster=new THREE.Raycaster();
    const onClick=(e)=>{if(R.dragged)return;const rect=renderer.domElement.getBoundingClientRect();const x=((e.clientX-rect.left)/rect.width)*2-1,y=-((e.clientY-rect.top)/rect.height)*2+1;raycaster.setFromCamera({x,y},cam);const hits=raycaster.intersectObjects(R.squares);if(hits.length){const{r,c}=hits[0].object.userData;onSquareClick(r,c);}};
    renderer.domElement.addEventListener("mousedown",onDown);renderer.domElement.addEventListener("touchstart",onDown,{passive:true});
    window.addEventListener("mouseup",onUp);window.addEventListener("touchend",onUp);
    window.addEventListener("mousemove",onMove);window.addEventListener("touchmove",onMove,{passive:true});
    renderer.domElement.addEventListener("click",onClick);
    const onResize=()=>{const W2=el.clientWidth||300,H2=el.clientHeight||300;renderer.setSize(W2,H2);cam.aspect=W2/H2;cam.updateProjectionMatrix();};
    window.addEventListener("resize",onResize);
    return()=>{cancelAnimationFrame(R.frame);renderer.dispose();renderer.domElement.remove();window.removeEventListener("mouseup",onUp);window.removeEventListener("mousemove",onMove);window.removeEventListener("touchend",onUp);window.removeEventListener("touchmove",onMove);window.removeEventListener("resize",onResize);};
  },[]);

  // Update square highlights
  useEffect(()=>{
    const R=refs.current;if(!R.squares.length)return;
    const BT=BTS[boardThemeName]||BTS.Cappuccino;
    R.squares.forEach(mesh=>{
      const{r,c,light}=mesh.userData;
      const isSel=selected?.r===r&&selected?.c===c;
      const isLeg=legalMoves?.some(m=>m.r===r&&m.c===c);
      const isLast=lastMove&&((lastMove.from?.r===r&&lastMove.from?.c===c)||(lastMove.to?.r===r&&lastMove.to?.c===c));
      let color=light?BT.light:BT.dark;
      if(isLast)color=light?"#cdd26a":"#999030";
      if(isSel)color="#7fd17f";
      if(isLeg)color=light?"#99aaff":"#6677ee";
      mesh.material.color.set(color);
      mesh.material.emissive?.set(isSel?"#1a441a":isLeg?"#111a44":"#000");
      if(mesh.material.emissiveIntensity!==undefined)mesh.material.emissiveIntensity=isSel?0.4:isLeg?0.25:0;
    });
  },[selected,legalMoves,lastMove,boardThemeName]);

  // Update pieces
  useEffect(()=>{
    const R=refs.current;if(!R.scene)return;
    Object.values(R.pieces).forEach(m=>R.scene.remove(m));R.pieces={};
    for(let r=0;r<8;r++)for(let c=0;c<8;c++){
      const piece=board[r][c];if(!piece)continue;
      const isWhite=col(piece)==="w";
      const group=buildPieceMesh(piece,isWhite);
      const{x,z}=b2w(r,c);
      group.position.set(x,0.1,z);
      group.castShadow=true;
      R.scene.add(group);R.pieces[`${r},${c}`]=group;
    }
  },[board,flipped]);

  return(
    <div style={{width:"100%",height:"100%",position:"relative"}}>
      <div ref={mountRef} style={{width:"100%",height:"100%",cursor:"grab"}}/>
      <div style={{position:"absolute",bottom:"6px",left:"50%",transform:"translateX(-50%)",background:"rgba(13,27,42,0.75)",borderRadius:"8px",padding:"3px 10px",color:"#7a9ab8",fontSize:"10px",pointerEvents:"none",letterSpacing:"0.06em",whiteSpace:"nowrap"}}>drag to rotate · pinch to zoom</div>
    </div>
  );
}

// ─── SHARED UI ────────────────────────────────────────────────────────────────
const Wrap=({children})=><div style={{minHeight:"100vh",maxWidth:"480px",margin:"0 auto",background:S.bg,color:S.text,fontFamily:"'Helvetica Neue',Arial,sans-serif",display:"flex",flexDirection:"column",boxSizing:"border-box"}}>{children}</div>;
const Header=({title,onBack,right})=><div style={{background:S.header,padding:"14px 16px",display:"flex",alignItems:"center",gap:"10px",borderBottom:`1px solid ${S.border}`,flexShrink:0}}>{onBack&&<button onClick={onBack} style={{background:"transparent",border:"none",color:S.textSub,cursor:"pointer",fontSize:"20px",padding:"0",lineHeight:1}}>←</button>}<span style={{fontSize:"17px",fontWeight:"700",color:S.text,flex:1,textAlign:onBack?"center":"left"}}>{title}</span>{right||<div style={{width:24}}/>}</div>;
const Toggle=({value,onChange})=><div onClick={()=>onChange(!value)} style={{width:"46px",height:"26px",borderRadius:"13px",background:value?S.accent:"#2a3a4a",cursor:"pointer",position:"relative",transition:"background 0.25s",flexShrink:0}}><div style={{position:"absolute",top:"3px",left:value?"23px":"3px",width:"20px",height:"20px",borderRadius:"50%",background:"#fff",transition:"left 0.25s",boxShadow:"0 1px 4px rgba(0,0,0,0.4)"}}/></div>;
const SL=({children})=><div style={{color:S.accent,fontSize:"12px",fontWeight:"700",letterSpacing:"0.1em",padding:"14px 16px 6px",textTransform:"uppercase"}}>{children}</div>;

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App(){
  const[screen,setScreen]=useState("home");
  const[myAvatar,setMyAvatar]=useState(AVATARS[0]);
  const[soundOn,setSoundOn]=useState(true);
  const[vibration,setVib]=useState(true);
  const[showCoords,setShowCoords]=useState(true);
  const[difficulty,setDiff]=useState("Hard");
  const[boardTheme,setBT]=useState("Cappuccino");
  const[use3D,setUse3D]=useState(true);
  const[lbTab,setLbTab]=useState("global");
  const[friendSearch,setFS]=useState("");
  // Puzzle
  const[puzzleIdx,setPzIdx]=useState(null);
  const[puzzleBoard,setPzBoard]=useState(null);
  const[puzzleSel,setPzSel]=useState(null);
  const[puzzleLegal,setPzLegal]=useState([]);
  const[puzzleStatus,setPzStatus]=useState(null);
  const[puzzleStep,setPzStep]=useState(0);
  // Game
  const[board,setBoard]=useState(initBoard());
  const[turn,setTurn]=useState("w");
  const[sel,setSel]=useState(null);
  const[lm,setLm]=useState([]);
  const[ep,setEp]=useState(null);
  const[cr,setCr]=useState({w:{k:true,q:true},b:{k:true,q:true}});
  const[gameStatus,setGS]=useState(null);
  const[capW,setCapW]=useState([]);
  const[capB,setCapB]=useState([]);
  const[lastMv,setLastMv]=useState(null);
  const[history,setHistory]=useState([]);
  const[histIdx,setHistIdx]=useState(-1);
  const[drawOffer,setDrawOffer]=useState(null);
  const[vsMode,setVsMode]=useState("ai");
  const[flipped,setFlipped]=useState(false);
  const[aiT,setAiT]=useState(false);
  const[showMoves,setShowMoves]=useState(false);
  const[joinCode,setJC]=useState("");
  const[copied,setCopied]=useState(false);
  const[analysisIdx,setAIdx]=useState(0);

  const sound=useSound(soundOn);
  const mp=useMP();
  const gameOver=gameStatus&&(gameStatus.includes("wins")||gameStatus.includes("draw")||gameStatus.includes("Draw")||gameStatus.includes("Stale")||gameStatus.includes("time"));
  const isReplay=histIdx>=0;
  const{wT,bT,flag,reset:resetT}=useTimers(turn,!!gameOver||isReplay||(vsMode==="online"&&!mp.connected));
  const histRef=useRef(null);
  const BT2=BTS[boardTheme];

  useEffect(()=>{if(flag&&!gameOver)setGS(flag==="w"?"Black wins on time!":"White wins on time!");},[flag,gameOver]);
  useEffect(()=>{const t=turn==="w"?wT:bT;if(t<=10&&t>0&&!gameOver)sound.tick();},[wT,bT,turn]);
  useEffect(()=>{if(histRef.current)histRef.current.scrollTop=histRef.current.scrollHeight;},[history]);
  useEffect(()=>{if(!mp.incomingMove)return;const mv=mp.incomingMove;mp.setIM(null);if(mv.type==="resign"){sound.over();setGS(mp.myColor==="w"?"White wins by resignation!":"Black wins by resignation!");return;}if(mv.type==="draw_offer"){setDrawOffer(mp.myColor==="w"?"b":"w");return;}if(mv.type==="draw_accept"){sound.over();setGS("Draw by agreement!");return;}if(mv.from&&mv.to)doMove(board,mv.from,mv.to,turn,ep,cr,capW,capB,history,true);},[mp.incomingMove]);

  const checkEnd=useCallback((b,nt,nep,ncr)=>{const chk=inChk(b,nt),has=allLeg(b,nt,nep,ncr).length>0;if(!has){if(chk){sound.over();setGS(nt==="w"?"Black wins by checkmate!":"White wins by checkmate!");}else setGS("Stalemate — draw!");}else if(chk){sound.check();setGS(nt==="w"?"White is in check":"Black is in check");}else setGS(null);},[soundOn]);

  const doMove=useCallback((b,from,move,ct,curEp,curCr,curCW,curCB,curH,skip=false)=>{
    const piece=b[from.r][from.c];const cap=b[move.r][move.c];let nCW=[...curCW],nCB=[...curCB];
    if(cap){col(cap)==="w"?nCW.push(cap):nCB.push(cap);}
    if(move.ep){const e=b[from.r][move.c];col(e)==="w"?nCW.push(e):nCB.push(e);}
    const nb=apMv(b,from,move);const ncr={w:{...curCr.w},b:{...curCr.b}};
    if(typ(piece)==="K"){ncr[ct].k=false;ncr[ct].q=false;}
    if(typ(piece)==="R"){const row=ct==="w"?7:0;if(from.r===row&&from.c===7)ncr[ct].k=false;if(from.r===row&&from.c===0)ncr[ct].q=false;}
    const nep=typ(piece)==="P"&&Math.abs(move.r-from.r)===2?[move.r+(ct==="w"?1:-1),move.c]:null;
    const nt=ct==="w"?"b":"w";const alg=toAlg(b,from,move);
    const snap={board:nb,turn:nt,ep:nep,cr:ncr,alg,capW:nCW,capB:nCB,lastMv:{from,to:{r:move.r,c:move.c}}};
    if(move.castle)sound.castle();else if(cap||move.ep)sound.capture();else sound.move();
    if(!skip&&vsMode==="online")mp.send({from,to:move});
    setHistory(h=>[...curH,snap]);setHistIdx(-1);setBoard(nb);setTurn(nt);setEp(nep);setCr(ncr);
    setCapW(nCW);setCapB(nCB);setLastMv({from,to:{r:move.r,c:move.c}});setDrawOffer(null);setSel(null);setLm([]);
    return{nb,nt,nep,ncr};
  },[vsMode,soundOn]);

  useEffect(()=>{if(vsMode!=="ai"||turn!=="b"||gameOver||aiT||isReplay)return;setAiT(true);setTimeout(()=>{const depth={Easy:1,Medium:2,Hard:3,Expert:4}[difficulty];const res=mmx(board,depth,-Infinity,Infinity,false,ep,cr);if(res.move){const{nb,nt,nep,ncr}=doMove(board,res.move.from,res.move.to,"b",ep,cr,capW,capB,history);checkEnd(nb,nt,nep,ncr);}setAiT(false);},80);},[turn,vsMode,gameOver,aiT,board,ep,cr,difficulty,isReplay]);

  const handleSq=useCallback((r,c)=>{if(isReplay||gameOver||aiT)return;if(vsMode==="ai"&&turn==="b")return;if(vsMode==="online"&&(!mp.connected||turn!==mp.myColor))return;if(gameStatus&&!gameStatus.includes("check"))return;if(sel){const mv=lm.find(m=>m.r===r&&m.c===c);if(mv){const{nb,nt,nep,ncr}=doMove(board,sel,mv,turn,ep,cr,capW,capB,history);checkEnd(nb,nt,nep,ncr);return;}setSel(null);setLm([]);if(col(board[r][c])===turn){setSel({r,c});setLm(legMv(board,r,c,ep,cr));}}else{if(col(board[r][c])===turn){setSel({r,c});setLm(legMv(board,r,c,ep,cr));}}},[board,turn,sel,lm,ep,cr,gameStatus,gameOver,aiT,vsMode,isReplay,mp,history,capW,capB]);

  const resetGame=()=>{setBoard(initBoard());setTurn("w");setSel(null);setLm([]);setEp(null);setCr({w:{k:true,q:true},b:{k:true,q:true}});setGS(null);setCapW([]);setCapB([]);setLastMv(null);setAiT(false);setHistory([]);setHistIdx(-1);setDrawOffer(null);resetT();};
  const jumpTo=(idx)=>{if(idx===-1){const last=history[history.length-1];if(last){setBoard(last.board);setTurn(last.turn);setEp(last.ep);setCr(last.cr);setCapW(last.capW);setCapB(last.capB);setLastMv(last.lastMv);}else{setBoard(initBoard());setTurn("w");setEp(null);setCr({w:{k:true,q:true},b:{k:true,q:true}});setCapW([]);setCapB([]);}setHistIdx(-1);}else{const s=history[idx];setBoard(s.board);setTurn(s.turn);setEp(s.ep);setCr(s.cr);setCapW(s.capW);setCapB(s.capB);setLastMv(s.lastMv);setHistIdx(idx);}setSel(null);setLm([]);};

  // Puzzle handlers
  const startPuzzle=(idx)=>{
    const pz=PUZZLES[idx];
    const pb=parseFen(pz.fen);
    setPzIdx(idx);setPzBoard(pb);setPzSel(null);setPzLegal([]);setPzStatus(null);setPzStep(0);
  };
  const handlePuzzleSq=(r,c)=>{
    if(!puzzleBoard||puzzleStatus==="done")return;
    const pz=PUZZLES[puzzleIdx];
    if(puzzleSel){
      const mv=puzzleLegal.find(m=>m.r===r&&m.c===c);
      if(mv){
        const uci=FILES[puzzleSel.c]+(8-puzzleSel.r)+FILES[mv.c]+(8-mv.r);
        const expected=pz.solution[puzzleStep];
        const nb=apMv(puzzleBoard,puzzleSel,mv);
        setPzBoard(nb);setPzSel(null);setPzLegal([]);
        if(uci===expected){
          if(puzzleStep>=pz.solution.length-1){setPzStatus("done");sound.success();}
          else{setPzStep(s=>s+1);setPzStatus("correct");setTimeout(()=>setPzStatus(null),1200);}
        }else{setPzStatus("wrong");sound.fail();}
      }else{
        setPzSel(null);setPzLegal([]);
        if(puzzleBoard[r][c]){setPzSel({r,c});setPzLegal(legMv(puzzleBoard,r,c,null,{w:{k:true,q:true},b:{k:true,q:true}}));}
      }
    }else{
      if(puzzleBoard[r][c]){setPzSel({r,c});setPzLegal(legMv(puzzleBoard,r,c,null,{w:{k:true,q:true},b:{k:true,q:true}}));}
    }
  };

  const PlayerBar=({name,timeVal,isActive,isLow,captures,avatarEmoji})=>(
    <div style={{display:"flex",alignItems:"center",gap:"10px",padding:"9px 14px",background:isActive?"#1a3a5c":S.panel,transition:"background 0.3s",flexShrink:0,borderTop:`1px solid ${S.border}`}}>
      <div style={{width:"36px",height:"36px",borderRadius:"50%",background:isActive?S.accent+"44":S.border,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"20px",flexShrink:0}}>{avatarEmoji}</div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:"13px",fontWeight:"600",color:isActive?S.text:S.textSub,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{name}</div>
        <div style={{display:"flex",gap:"1px",height:"12px",alignItems:"center",overflow:"hidden",marginTop:"1px"}}>
          {captures.slice(0,14).map((p,i)=><span key={i} style={{fontSize:"9px",lineHeight:1}}>{GLYPHS[p]}</span>)}
          {captures.length>14&&<span style={{fontSize:"9px",color:S.textSub}}>+{captures.length-14}</span>}
        </div>
      </div>
      <div style={{fontVariantNumeric:"tabular-nums",fontSize:"20px",fontWeight:"700",color:isLow?"#ff5555":isActive?"#fff":S.textSub,background:isActive?S.bg+"aa":"transparent",padding:"4px 10px",borderRadius:"8px",minWidth:"68px",textAlign:"right",flexShrink:0}}>{fmt(timeVal)}</div>
    </div>
  );

  const MiniBoard=({b,lm2})=>(
    <div style={{display:"grid",gridTemplateColumns:"repeat(8,1fr)",width:"min(260px,72vw)",height:"min(260px,72vw)",borderRadius:"4px",overflow:"hidden",border:`2px solid ${S.border}`}}>
      {[0,1,2,3,4,5,6,7].map(r=>[0,1,2,3,4,5,6,7].map(c=>{
        const light=(r+c)%2===0;
        const isL2=lm2&&((lm2.from?.r===r&&lm2.from?.c===c)||(lm2.to?.r===r&&lm2.to?.c===c));
        return <div key={`${r}${c}`} style={{background:isL2?"#cdd26a":light?BT2.light:BT2.dark,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"min(4vw,22px)"}}>
          {b[r][c]?GLYPHS[b[r][c]]:""}
        </div>;
      }))}
    </div>
  );

  // ── ANALYSIS ────────────────────────────────────────────────────────────────
  if(screen==="analysis"){
    const anns=analyzeGame(history);
    const counts={blunder:anns.filter(a=>a.ann==="??").length,mistake:anns.filter(a=>a.ann==="?").length,inaccuracy:anns.filter(a=>a.ann==="?!").length,brilliant:anns.filter(a=>a.ann==="!!").length};
    const dispBoard=analysisIdx<history.length?history[analysisIdx].board:initBoard();
    const dispLast=analysisIdx<history.length?history[analysisIdx].lastMv:null;
    const annColor=a=>a==="!!"?"#f0c040":a==="!"?"#80cc40":a==="?!"?"#f0a020":a==="?"?S.red:"#cc0000";
    return(
      <Wrap>
        <Header title="Game Analysis" onBack={()=>setScreen("game")}/>
        <div style={{display:"flex",gap:"8px",padding:"10px 12px",background:S.panel,borderBottom:`1px solid ${S.border}`,flexShrink:0}}>
          {[["!!",counts.brilliant,"#f0c040","Brilliant"],["?!",counts.inaccuracy,"#f0a020","Inaccuracy"],["?",counts.mistake,S.red,"Mistake"],["??",counts.blunder,"#cc0000","Blunder"]].map(([sym,count,color,label])=>(
            <div key={sym} style={{flex:1,background:S.card,borderRadius:"10px",border:`1px solid ${S.border}`,padding:"8px 4px",textAlign:"center"}}>
              <div style={{fontSize:"15px",fontWeight:"800",color,fontFamily:"monospace"}}>{sym}</div>
              <div style={{fontSize:"20px",fontWeight:"700",color:S.text}}>{count}</div>
              <div style={{fontSize:"9px",color:S.textSub,marginTop:"1px"}}>{label}</div>
            </div>
          ))}
        </div>
        <div style={{display:"flex",justifyContent:"center",padding:"10px 0 6px",background:S.bg}}><MiniBoard b={dispBoard} lm2={dispLast}/></div>
        <div style={{display:"flex",gap:"8px",padding:"8px 12px",background:S.panel,borderTop:`1px solid ${S.border}`,borderBottom:`1px solid ${S.border}`,flexShrink:0}}>
          {[["⏮",()=>setAIdx(0)],["◀",()=>setAIdx(i=>Math.max(0,i-1))],["▶",()=>setAIdx(i=>Math.min(history.length-1,i+1))],["⏭",()=>setAIdx(history.length-1)]].map(([icon,fn],i)=>(
            <button key={i} onClick={fn} style={{flex:1,padding:"9px",background:S.card,border:`1px solid ${S.border}`,borderRadius:"8px",color:S.accent,cursor:"pointer",fontSize:"16px"}}>{icon}</button>
          ))}
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"6px 12px"}}>
          {anns.length===0&&<div style={{textAlign:"center",color:S.textSub,padding:"32px",fontSize:"13px"}}>No moves to analyze.<br/>Play a game first!</div>}
          {Array.from({length:Math.ceil(anns.length/2)}).map((_,i)=>{
            const w=anns[i*2],b=anns[i*2+1];
            return <div key={i} style={{display:"flex",gap:"4px",alignItems:"center",padding:"2px 0"}}>
              <span style={{color:S.textSub,fontSize:"12px",width:"24px",textAlign:"right",flexShrink:0}}>{i+1}.</span>
              {w&&<button onClick={()=>setAIdx(i*2)} style={{flex:1,padding:"5px 8px",background:analysisIdx===i*2?S.accent+"22":"transparent",color:analysisIdx===i*2?S.accent:S.text,border:`1px solid ${analysisIdx===i*2?S.accent:"transparent"}`,borderRadius:"6px",cursor:"pointer",fontSize:"13px",fontFamily:"monospace",textAlign:"left",display:"flex",justifyContent:"space-between"}}>
                <span>{w.alg}</span>{w.ann&&<span style={{color:annColor(w.ann),fontWeight:"800"}}>{w.ann}</span>}
              </button>}
              {b&&<button onClick={()=>setAIdx(i*2+1)} style={{flex:1,padding:"5px 8px",background:analysisIdx===i*2+1?S.accent+"22":"transparent",color:analysisIdx===i*2+1?S.accent:S.textSub,border:`1px solid ${analysisIdx===i*2+1?S.accent:"transparent"}`,borderRadius:"6px",cursor:"pointer",fontSize:"13px",fontFamily:"monospace",textAlign:"left",display:"flex",justifyContent:"space-between"}}>
                <span>{b.alg}</span>{b.ann&&<span style={{color:annColor(b.ann),fontWeight:"800"}}>{b.ann}</span>}
              </button>}
            </div>;
          })}
        </div>
      </Wrap>
    );
  }

  // ── PUZZLES ──────────────────────────────────────────────────────────────────
  if(screen==="puzzles"){
    if(puzzleBoard!==null){
      const pz=PUZZLES[puzzleIdx];
      return(
        <Wrap>
          <Header title={pz.title} onBack={()=>{setPzBoard(null);setPzIdx(null);}}/>
          <div style={{padding:"10px 14px",background:S.panel,borderBottom:`1px solid ${S.border}`,flexShrink:0}}>
            <div style={{fontSize:"13px",color:S.textSub}}>{pz.description}</div>
            <div style={{display:"flex",gap:"8px",marginTop:"6px"}}>
              <span style={{fontSize:"11px",background:S.accent+"22",color:S.accent,padding:"2px 8px",borderRadius:"10px"}}>{pz.theme}</span>
              <span style={{fontSize:"11px",background:S.card,color:S.textSub,padding:"2px 8px",borderRadius:"10px"}}>Rating {pz.rating}</span>
              <span style={{fontSize:"11px",background:S.card,color:S.textSub,padding:"2px 8px",borderRadius:"10px"}}>Step {puzzleStep+1}/{pz.solution.length}</span>
            </div>
          </div>
          {puzzleStatus&&(
            <div style={{padding:"10px 14px",background:puzzleStatus==="done"||puzzleStatus==="correct"?S.green+"22":S.red+"22",borderBottom:`1px solid ${puzzleStatus==="done"||puzzleStatus==="correct"?S.green:S.red}`,textAlign:"center",flexShrink:0}}>
              <span style={{fontSize:"14px",fontWeight:"700",color:puzzleStatus==="done"||puzzleStatus==="correct"?S.green:S.red}}>
                {puzzleStatus==="done"?"🎉 Brilliant! Puzzle solved!":puzzleStatus==="correct"?"✓ Correct! Keep going…":"✗ Wrong move. Try again!"}
              </span>
            </div>
          )}
          <div style={{flex:"1 1 0",display:"flex",alignItems:"center",justifyContent:"center",padding:"8px",minHeight:0,background:S.bg}}>
            <div style={{width:"min(calc(100vw-16px),calc(100vh-320px),380px)",height:"min(calc(100vw-16px),calc(100vh-320px),380px)"}}>
              {use3D?(
                <Board3D board={puzzleBoard} selected={puzzleSel} legalMoves={puzzleLegal} lastMove={null} onSquareClick={handlePuzzleSq} flipped={false} boardThemeName={boardTheme}/>
              ):(
                <div style={{display:"grid",gridTemplateColumns:"repeat(8,1fr)",width:"100%",height:"100%",borderRadius:"4px",overflow:"hidden",border:`2px solid ${S.border}`}}>
                  {[0,1,2,3,4,5,6,7].map(r=>[0,1,2,3,4,5,6,7].map(c=>{
                    const light=(r+c)%2===0;const isSel=puzzleSel?.r===r&&puzzleSel?.c===c;const isLeg=puzzleLegal.some(m=>m.r===r&&m.c===c);
                    let bg=light?BT2.light:BT2.dark;if(isSel)bg="#7fd17f";if(isLeg)bg=light?"#99aaff":"#6677ee";
                    return <div key={`${r}${c}`} onClick={()=>handlePuzzleSq(r,c)} style={{background:bg,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:"min(5.5vw,36px)",WebkitTapHighlightColor:"transparent"}}>
                      {puzzleBoard[r][c]?GLYPHS[puzzleBoard[r][c]]:""}
                    </div>;
                  }))}
                </div>
              )}
            </div>
          </div>
          <div style={{display:"flex",background:S.panel,borderTop:`1px solid ${S.border}`,flexShrink:0}}>
            <button onClick={()=>startPuzzle(puzzleIdx)} style={{flex:1,padding:"13px",background:"transparent",border:"none",borderRight:`1px solid ${S.border}`,color:S.textSub,cursor:"pointer",fontSize:"13px",fontFamily:"inherit"}}>↺ Retry</button>
            {puzzleStatus==="done"&&puzzleIdx<PUZZLES.length-1&&<button onClick={()=>startPuzzle(puzzleIdx+1)} style={{flex:1,padding:"13px",background:S.green+"22",border:"none",borderRight:`1px solid ${S.border}`,color:S.green,cursor:"pointer",fontSize:"13px",fontFamily:"inherit",fontWeight:"700"}}>Next ›</button>}
            <button onClick={()=>{setPzBoard(null);setPzIdx(null);}} style={{flex:1,padding:"13px",background:"transparent",border:"none",color:S.textSub,cursor:"pointer",fontSize:"13px",fontFamily:"inherit"}}>All Puzzles</button>
          </div>
        </Wrap>
      );
    }
    return(
      <Wrap>
        <Header title="Puzzles" onBack={()=>setScreen("home")}/>
        <div style={{flex:1,overflowY:"auto",padding:"12px",display:"flex",flexDirection:"column",gap:"10px"}}>
          <div style={{background:`linear-gradient(135deg,#0f2336,#1a4060)`,borderRadius:"14px",padding:"16px",display:"flex",alignItems:"center",gap:"14px"}}>
            <div style={{fontSize:"36px"}}>🧩</div>
            <div><div style={{fontSize:"17px",fontWeight:"700",color:S.text}}>Daily Puzzles</div><div style={{fontSize:"12px",color:S.textSub,marginTop:"3px"}}>Train tactics · {PUZZLES.length} puzzles available</div></div>
          </div>
          {PUZZLES.map((pz,i)=>(
            <button key={pz.id} onClick={()=>startPuzzle(i)} style={{display:"flex",alignItems:"center",gap:"12px",padding:"13px 16px",background:S.card,border:`1px solid ${S.border}`,borderRadius:"12px",cursor:"pointer",textAlign:"left",width:"100%"}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=S.accent;}} onMouseLeave={e=>{e.currentTarget.style.borderColor=S.border;}}>
              <div style={{width:"44px",height:"44px",borderRadius:"12px",background:"#e0703022",border:"1px solid #e0703044",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"22px",flexShrink:0}}>🧩</div>
              <div style={{flex:1}}>
                <div style={{fontSize:"15px",fontWeight:"600",color:S.text}}>{pz.title}</div>
                <div style={{fontSize:"12px",color:S.textSub,marginTop:"2px"}}>{pz.theme} · Rating {pz.rating}</div>
              </div>
              <div style={{textAlign:"right",flexShrink:0}}>
                <div style={{fontSize:"13px",color:S.accent,fontWeight:"600"}}>{pz.rating}</div>
                <div style={{fontSize:"11px",color:S.textSub}}>{"★".repeat(Math.min(3,Math.floor(pz.rating/400)))}</div>
              </div>
            </button>
          ))}
        </div>
      </Wrap>
    );
  }

  // ── SETTINGS ──────────────────────────────────────────────────────────────
  if(screen==="settings") return(
    <Wrap>
      <Header title="Settings" onBack={()=>setScreen("home")}/>
      <div style={{flex:1,overflowY:"auto"}}>
        <SL>General</SL>
        <div style={{background:S.card,borderTop:`1px solid ${S.border}`,borderBottom:`1px solid ${S.border}`}}>
          {[["🔊","Sounds",soundOn,setSoundOn],["📳","Vibrations",vibration,setVib],["📐","Show coordinates",showCoords,setShowCoords],["🎲","3D Board",use3D,setUse3D]].map(([icon,label,val,fn],i,arr)=>(
            <div key={label} style={{display:"flex",alignItems:"center",gap:"14px",padding:"13px 16px",borderBottom:i<arr.length-1?`1px solid ${S.border}`:"none"}}>
              <div style={{width:32,height:32,borderRadius:"8px",background:S.border,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"16px",flexShrink:0}}>{icon}</div>
              <span style={{flex:1,fontSize:"15px",color:S.text}}>{label}</span>
              <Toggle value={val} onChange={fn}/>
            </div>
          ))}
        </div>
        <SL>AI Difficulty</SL>
        <div style={{background:S.card,borderTop:`1px solid ${S.border}`,borderBottom:`1px solid ${S.border}`,padding:"12px 16px"}}>
          <div style={{display:"flex",gap:"8px"}}>
            {["Easy","Medium","Hard","Expert"].map(d=>(
              <button key={d} onClick={()=>setDiff(d)} style={{flex:1,padding:"9px 4px",background:difficulty===d?S.accent+"33":"transparent",border:`1.5px solid ${difficulty===d?S.accent:S.border}`,borderRadius:"8px",color:difficulty===d?S.accent:S.textSub,cursor:"pointer",fontSize:"12px",fontFamily:"inherit",fontWeight:difficulty===d?"700":"400"}}>{d}</button>
            ))}
          </div>
        </div>
        <SL>Board Theme</SL>
        <div style={{background:S.card,borderTop:`1px solid ${S.border}`,borderBottom:`1px solid ${S.border}`,padding:"12px 16px"}}>
          <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
            {Object.entries(BTS).map(([name,t])=>(
              <div key={name} onClick={()=>setBT(name)} style={{display:"flex",alignItems:"center",gap:"10px",padding:"10px 12px",background:boardTheme===name?S.accent+"22":"transparent",border:`1px solid ${boardTheme===name?S.accent:S.border}`,borderRadius:"10px",cursor:"pointer"}}>
                <div style={{display:"flex",borderRadius:"4px",overflow:"hidden",flexShrink:0}}>{[t.light,t.dark,t.light,t.dark].map((c,i)=><div key={i} style={{width:"14px",height:"14px",background:c}}/>)}</div>
                <span style={{flex:1,fontSize:"14px",color:boardTheme===name?S.accent:S.text}}>{name}</span>
                {boardTheme===name&&<span style={{color:S.accent}}>✓</span>}
              </div>
            ))}
          </div>
        </div>
        <div style={{height:"24px"}}/>
      </div>
    </Wrap>
  );

  // ── LEADERBOARD ────────────────────────────────────────────────────────────
  if(screen==="leaderboard") return(
    <Wrap>
      <Header title="Rankings" onBack={()=>setScreen("home")}/>
      <div style={{display:"flex",background:S.panel,borderBottom:`1px solid ${S.border}`,flexShrink:0}}>
        {[["global","🌍 Global"],["local","🇺🇸 Country"]].map(([key,label])=>(
          <button key={key} onClick={()=>setLbTab(key)} style={{flex:1,padding:"13px",background:lbTab===key?S.accent:"transparent",border:"none",color:lbTab===key?"#fff":S.textSub,cursor:"pointer",fontSize:"14px",fontWeight:lbTab===key?"700":"400",fontFamily:"inherit"}}>{label}</button>
        ))}
      </div>
      <div style={{background:`linear-gradient(135deg,${S.accent}33,${S.card})`,margin:"12px 12px 0",borderRadius:"12px",border:`1px solid ${S.accent}55`,padding:"12px 16px",display:"flex",alignItems:"center",gap:"12px"}}>
        <div style={{fontSize:"24px"}}>{myAvatar.emoji}</div>
        <div style={{flex:1}}><div style={{fontSize:"14px",fontWeight:"700",color:S.text}}>You</div><div style={{fontSize:"12px",color:S.textSub}}>Your position</div></div>
        <div style={{textAlign:"right"}}><div style={{fontSize:"18px",fontWeight:"800",color:S.accent}}>#2,841</div><div style={{fontSize:"12px",color:S.green}}>↑ 1200</div></div>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"8px 0"}}>
        {GLOBAL_LB.map((p,i)=>(
          <div key={p.rank} style={{display:"flex",alignItems:"center",gap:"12px",padding:"11px 16px",background:i%2===0?"transparent":S.card+"44"}}>
            <div style={{width:"32px",textAlign:"center",flexShrink:0}}>
              {p.rank<=3?<span style={{fontSize:"18px"}}>{"🥇🥈🥉"[p.rank-1]}</span>:<span style={{fontSize:"14px",fontWeight:"700",color:p.rank<=10?S.accent:S.textSub}}>#{p.rank}</span>}
            </div>
            <div style={{fontSize:"18px",flexShrink:0}}>{p.flag}</div>
            <div style={{flex:1,fontSize:"14px",fontWeight:"500",color:S.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</div>
            <div style={{display:"flex",alignItems:"center",gap:"6px",flexShrink:0}}>
              <span style={{fontSize:"15px",fontWeight:"700",color:p.rank<=3?S.gold:S.text,fontVariantNumeric:"tabular-nums"}}>{p.rating}</span>
              {p.delta!==0&&<span style={{fontSize:"11px",color:p.delta>0?S.green:S.red,fontWeight:"600",minWidth:"28px"}}>{p.delta>0?"+":""}{p.delta}</span>}
            </div>
          </div>
        ))}
      </div>
    </Wrap>
  );

  // ── AVATAR ─────────────────────────────────────────────────────────────────
  if(screen==="avatar") return(
    <Wrap>
      <Header title="Choose Avatar" onBack={()=>setScreen("home")}/>
      <div style={{flex:1,overflowY:"auto",padding:"12px"}}>
        <div style={{color:S.textSub,fontSize:"12px",textAlign:"center",marginBottom:"12px"}}>🔒 Earn locked avatars by playing more games</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"10px"}}>
          {AVATARS.map(av=>{const selected=myAvatar.id===av.id;return(
            <div key={av.id} onClick={()=>{if(!av.locked){setMyAvatar(av);setScreen("home");}}} style={{aspectRatio:"1",borderRadius:"16px",background:selected?S.accent+"33":S.card,border:`2px solid ${selected?S.accent:S.border}`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",cursor:av.locked?"not-allowed":"pointer",position:"relative",opacity:av.locked?0.5:1}}>
              <div style={{fontSize:"52px",lineHeight:1}}>{av.emoji}</div>
              <div style={{fontSize:"11px",color:selected?S.accent:S.textSub,marginTop:"6px",fontWeight:"500"}}>{av.label}</div>
              {selected&&<div style={{position:"absolute",top:"6px",right:"6px",width:"18px",height:"18px",borderRadius:"50%",background:S.accent,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"10px",color:"#fff"}}>✓</div>}
              {av.locked&&<div style={{position:"absolute",top:"6px",right:"6px",fontSize:"14px"}}>🔒</div>}
            </div>
          );})}
        </div>
      </div>
    </Wrap>
  );

  // ── FRIENDS ────────────────────────────────────────────────────────────────
  if(screen==="friends"){
    const filtered=FRIENDS.filter(f=>f.name.toLowerCase().includes(friendSearch.toLowerCase()));
    const avColors=["#3a7bd5","#e05080","#4caf50","#f0a030","#9b59b6"];
    return(
      <Wrap>
        <Header title="Play with Friends" onBack={()=>setScreen("home")}/>
        <div style={{flex:1,overflowY:"auto"}}>
          <div style={{padding:"12px 16px",background:S.panel,borderBottom:`1px solid ${S.border}`}}>
            <div style={{display:"flex",gap:"8px"}}>
              <div style={{flex:1,display:"flex",alignItems:"center",gap:"8px",background:S.card,border:`1px solid ${S.border}`,borderRadius:"10px",padding:"10px 12px"}}>
                <span style={{color:S.textSub}}>🔍</span>
                <input value={friendSearch} onChange={e=>setFS(e.target.value)} placeholder="Search username" style={{flex:1,background:"transparent",border:"none",color:S.text,fontSize:"14px",outline:"none",fontFamily:"inherit"}}/>
              </div>
              <button style={{padding:"10px 16px",background:S.accent,border:"none",borderRadius:"10px",color:"#fff",cursor:"pointer",fontSize:"14px",fontWeight:"600",fontFamily:"inherit"}}>Search</button>
            </div>
          </div>
          <div style={{padding:"12px 16px 6px",color:S.accent,fontSize:"12px",fontWeight:"700",letterSpacing:"0.1em",textTransform:"uppercase"}}>Your Friends ({filtered.length})</div>
          {filtered.map(f=>{
            const ci=f.av.charCodeAt(0)%avColors.length;
            return(
              <div key={f.id} style={{display:"flex",alignItems:"center",gap:"12px",padding:"12px 16px",background:S.card,borderBottom:`1px solid ${S.border}`}}>
                <div style={{width:"46px",height:"46px",borderRadius:"50%",background:avColors[ci],display:"flex",alignItems:"center",justifyContent:"center",fontSize:"20px",fontWeight:"bold",color:"#fff",flexShrink:0,position:"relative",border:f.active?`2px solid ${S.green}`:"none"}}>
                  {f.av}{f.active&&<div style={{position:"absolute",bottom:0,right:0,width:"10px",height:"10px",borderRadius:"50%",background:S.green,border:"2px solid "+S.panel}}/>}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:"6px",marginBottom:"2px"}}>
                    <span style={{fontSize:"14px",fontWeight:"600",color:S.text}}>{f.name}</span>
                    <span style={{fontSize:"12px",color:S.textSub}}>({f.rating})</span>
                    {f.badge&&<span>{f.badge}</span>}
                  </div>
                  <div style={{display:"flex",gap:"8px"}}>
                    <span style={{fontSize:"11px",color:S.textSub}}>{f.flag} #{f.rank}</span>
                    <span style={{fontSize:"11px",color:S.textSub}}>🌍 #{f.global}</span>
                    <span style={{fontSize:"11px",color:S.textSub}}>🧩 {f.puzzles}</span>
                  </div>
                  <div style={{fontSize:"11px",color:f.active?S.green:S.textSub,marginTop:"1px"}}>{f.active?"● Active now":f.lastSeen}</div>
                </div>
                <div style={{display:"flex",gap:"6px",flexShrink:0}}>
                  <button onClick={()=>{setVsMode("online");mp.create();setFlipped(false);resetGame();setScreen("game");}} style={{width:"36px",height:"36px",background:S.accent+"22",border:`1px solid ${S.accent}44`,borderRadius:"8px",cursor:"pointer",fontSize:"16px"}}>♟</button>
                  <button style={{width:"36px",height:"36px",background:S.border,border:"none",borderRadius:"8px",cursor:"pointer",fontSize:"14px",color:S.textSub}}>⋮</button>
                </div>
              </div>
            );
          })}
          <div style={{padding:"16px",display:"flex",justifyContent:"flex-end"}}>
            <button style={{display:"flex",alignItems:"center",gap:"8px",padding:"12px 20px",background:S.accent,border:"none",borderRadius:"12px",color:"#fff",cursor:"pointer",fontSize:"14px",fontWeight:"600",fontFamily:"inherit",boxShadow:"0 4px 12px rgba(58,123,213,0.4)"}}>👥 Send Invite</button>
          </div>
        </div>
      </Wrap>
    );
  }

  // ── LOBBY ──────────────────────────────────────────────────────────────────
  if(screen==="lobby") return(
    <Wrap>
      <Header title="Online Multiplayer" onBack={()=>setScreen("home")}/>
      <div style={{flex:1,overflowY:"auto",padding:"16px",display:"flex",flexDirection:"column",gap:"12px"}}>
        {[{icon:"🔍",title:"Quick Match",sub:"Find a random opponent instantly",btnLabel:"Find Opponent",solid:true,fn:()=>{setVsMode("online");mp.create();setFlipped(false);resetGame();setScreen("game");}},{icon:"➕",title:"Create Room",sub:"Share a code with your friend",btnLabel:"Create Room",solid:false,fn:()=>{setVsMode("online");mp.create();setFlipped(false);resetGame();setScreen("game");}}].map(({icon,title,sub,btnLabel,solid,fn})=>(
          <div key={title} style={{background:S.card,borderRadius:"14px",border:`1px solid ${S.border}`,overflow:"hidden"}}>
            <div style={{padding:"14px 16px",borderBottom:`1px solid ${S.border}`}}><div style={{fontSize:"14px",fontWeight:"700",color:S.text}}>{icon} {title}</div><div style={{fontSize:"12px",color:S.textSub,marginTop:"2px"}}>{sub}</div></div>
            <div style={{padding:"14px 16px"}}><button onClick={fn} style={{width:"100%",padding:"13px",background:solid?S.accent:"transparent",border:solid?"none":`1.5px solid ${S.accent}`,borderRadius:"10px",color:solid?"#fff":S.accent,cursor:"pointer",fontSize:"15px",fontWeight:"600",fontFamily:"inherit"}}>{btnLabel}</button></div>
          </div>
        ))}
        <div style={{background:S.card,borderRadius:"14px",border:`1px solid ${S.border}`,overflow:"hidden"}}>
          <div style={{padding:"14px 16px",borderBottom:`1px solid ${S.border}`}}><div style={{fontSize:"14px",fontWeight:"700",color:S.text}}>🔑 Join with Code</div></div>
          <div style={{padding:"14px 16px",display:"flex",gap:"10px"}}>
            <input value={joinCode} onChange={e=>setJC(e.target.value.toUpperCase().slice(0,5))} placeholder="XXXXX" style={{flex:1,background:S.bg,border:`1.5px solid ${S.border}`,borderRadius:"10px",padding:"12px",color:S.text,fontSize:"18px",textAlign:"center",letterSpacing:"0.2em",fontFamily:"inherit",outline:"none"}}/>
            <button onClick={()=>{if(joinCode.length===5){setVsMode("online");mp.join(joinCode);setFlipped(true);resetGame();setScreen("game");}}} disabled={joinCode.length!==5} style={{padding:"12px 18px",background:joinCode.length===5?S.accent:"#1a2d40",border:"none",borderRadius:"10px",color:joinCode.length===5?"#fff":S.textSub,cursor:joinCode.length===5?"pointer":"default",fontSize:"14px",fontWeight:"600",fontFamily:"inherit"}}>Join</button>
          </div>
        </div>
        <button onClick={()=>setScreen("friends")} style={{display:"flex",alignItems:"center",gap:"12px",padding:"14px 16px",background:S.card,border:`1px solid ${S.border}`,borderRadius:"14px",cursor:"pointer",textAlign:"left",width:"100%"}}
          onMouseEnter={e=>e.currentTarget.style.borderColor=S.accent} onMouseLeave={e=>e.currentTarget.style.borderColor=S.border}>
          <div style={{width:"44px",height:"44px",borderRadius:"12px",background:"#9b59b622",border:"1px solid #9b59b644",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"22px"}}>👥</div>
          <div style={{flex:1}}><div style={{fontSize:"15px",fontWeight:"600",color:S.text}}>Play with Friends</div><div style={{fontSize:"12px",color:S.textSub,marginTop:"2px"}}>Challenge from friends list</div></div>
          <span style={{color:S.textSub,fontSize:"18px"}}>›</span>
        </button>
      </div>
    </Wrap>
  );

  // ── HOME ───────────────────────────────────────────────────────────────────
  if(screen==="home") return(
    <Wrap>
      <div style={{background:`linear-gradient(160deg,#0f2336,#1a3a5c)`,padding:"20px 20px 16px",display:"flex",alignItems:"center",gap:"14px"}}>
        <div onClick={()=>setScreen("avatar")} style={{width:"48px",height:"48px",borderRadius:"50%",background:S.card,border:`2px solid ${S.accent}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"28px",cursor:"pointer",flexShrink:0}}>{myAvatar.emoji}</div>
        <div style={{flex:1}}><div style={{fontSize:"13px",color:S.textSub}}>Welcome back</div><div style={{fontSize:"18px",fontWeight:"700",color:S.text}}>Player</div></div>
        <div style={{textAlign:"right"}}><div style={{fontSize:"11px",color:S.textSub}}>Rating</div><div style={{fontSize:"20px",fontWeight:"800",color:S.accent}}>1200</div></div>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"12px",display:"flex",flexDirection:"column",gap:"10px"}}>
        {[
          {icon:"🤖",label:"Play vs AI",sub:`${difficulty} difficulty`,color:S.accent,fn:()=>{setVsMode("ai");resetGame();setFlipped(false);setScreen("game");}},
          {icon:"👥",label:"Local 2 Players",sub:"Pass & play on this device",color:"#9b59b6",fn:()=>{setVsMode("local");resetGame();setFlipped(false);setScreen("game");}},
          {icon:"🌐",label:"Online Multiplayer",sub:"Play with friends online",color:"#16a085",fn:()=>setScreen("lobby")},
          {icon:"🧩",label:"Puzzles",sub:"Train your tactics",color:"#e07030",fn:()=>setScreen("puzzles")},
          {icon:"🏆",label:"Rankings",sub:"Compete globally",color:S.gold,fn:()=>setScreen("leaderboard")},
          {icon:"🔬",label:"Analyze Last Game",sub:history.length>0?`${history.length} moves recorded`:"Play a game first",color:"#cc66cc",fn:()=>{if(history.length>0){setAIdx(0);setScreen("analysis");}},disabled:history.length===0},
        ].map(({icon,label,sub,color,fn,disabled})=>(
          <button key={label} onClick={disabled?undefined:fn} style={{display:"flex",alignItems:"center",gap:"14px",padding:"13px 16px",background:S.card,border:`1px solid ${S.border}`,borderRadius:"14px",cursor:disabled?"not-allowed":"pointer",textAlign:"left",width:"100%",opacity:disabled?0.5:1}}
            onMouseEnter={e=>{if(!disabled){e.currentTarget.style.borderColor=color;e.currentTarget.style.background=color+"18";}}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=S.border;e.currentTarget.style.background=S.card;}}>
            <div style={{width:"44px",height:"44px",borderRadius:"12px",background:color+"22",border:`1px solid ${color}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"22px",flexShrink:0}}>{icon}</div>
            <div style={{flex:1}}><div style={{fontSize:"15px",fontWeight:"600",color:S.text}}>{label}</div><div style={{fontSize:"12px",color:S.textSub,marginTop:"2px"}}>{sub}</div></div>
            <span style={{color:S.textSub,fontSize:"18px"}}>›</span>
          </button>
        ))}
      </div>
      <div style={{display:"flex",borderTop:`1px solid ${S.border}`,background:S.panel}}>
        {[[myAvatar.emoji,"Avatar","avatar"],["👥","Friends","friends"],["⚙️","Settings","settings"]].map(([icon,label,sc])=>(
          <button key={label} onClick={()=>setScreen(sc)} style={{flex:1,padding:"12px 4px",background:"transparent",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:"3px"}}>
            <span style={{fontSize:"18px"}}>{icon}</span>
            <span style={{fontSize:"10px",color:S.textSub}}>{label}</span>
          </button>
        ))}
      </div>
    </Wrap>
  );

  // ── GAME ───────────────────────────────────────────────────────────────────
  const displayCols=flipped?[7,6,5,4,3,2,1,0]:[0,1,2,3,4,5,6,7];
  const rankLabels=flipped?["1","2","3","4","5","6","7","8"]:["8","7","6","5","4","3","2","1"];
  const fileLabels=flipped?["h","g","f","e","d","c","b","a"]:["a","b","c","d","e","f","g","h"];
  const isChkSq=(r,c)=>{const p=board[r][c];if(!p||typ(p)!=="K")return false;return inChk(board,col(p));};
  const topColor=flipped?"w":"b";const botColor=flipped?"b":"w";
  const topT=topColor==="w"?wT:bT,botT=botColor==="w"?wT:bT;
  const topCap=topColor==="w"?capB:capW,botCap=botColor==="w"?capB:capW;
  const topActive=turn===topColor&&!gameOver&&!isReplay;
  const botActive=turn===botColor&&!gameOver&&!isReplay;
  const oppName=vsMode==="ai"?"Computer":(vsMode==="online"?(mp.opponent||"Waiting…"):"Player 2");
  const statusColor=gameStatus?(gameStatus.includes("wins")?S.gold:gameStatus.includes("draw")||gameStatus.includes("Stale")?"#7b8cde":"#ff9966"):S.textSub;

  return(
    <Wrap>
      <div style={{display:"flex",alignItems:"center",padding:"9px 14px",background:S.header,borderBottom:`1px solid ${S.border}`,flexShrink:0,gap:"8px"}}>
        <button onClick={()=>{mp.disconnect();setScreen("home");}} style={{background:"transparent",border:"none",color:S.textSub,cursor:"pointer",fontSize:"20px",padding:"2px",lineHeight:1}}>←</button>
        <div style={{flex:1,textAlign:"center",fontSize:"12px",color:S.textSub,letterSpacing:"0.08em",textTransform:"uppercase"}}>{vsMode==="ai"?`vs Computer · ${difficulty}`:vsMode==="online"?`Online${mp.roomCode?" · "+mp.roomCode:""}`:vsMode==="local"?"Local Game":""}</div>
        <div style={{display:"flex",gap:"6px"}}>
          {vsMode==="online"&&mp.roomCode&&<button onClick={()=>{navigator.clipboard?.writeText(mp.roomCode);setCopied(true);setTimeout(()=>setCopied(false),2000);}} style={{background:copied?S.accent+"33":"transparent",border:`1px solid ${S.border}`,borderRadius:"6px",color:copied?S.accent:S.textSub,cursor:"pointer",fontSize:"11px",padding:"3px 8px"}}>{copied?"Copied ✓":mp.roomCode}</button>}
          <button onClick={()=>setShowMoves(h=>!h)} style={{background:showMoves?S.accent+"22":"transparent",border:`1px solid ${S.border}`,borderRadius:"6px",color:showMoves?S.accent:S.textSub,cursor:"pointer",fontSize:"11px",padding:"3px 8px"}}>Moves</button>
          <button onClick={()=>setFlipped(f=>!f)} style={{background:"transparent",border:`1px solid ${S.border}`,borderRadius:"6px",color:S.textSub,cursor:"pointer",fontSize:"14px",padding:"3px 8px"}}>⇅</button>
        </div>
      </div>

      <PlayerBar name={oppName} timeVal={topT} isActive={topActive} isLow={topT<=30} captures={topCap} avatarEmoji={vsMode==="ai"?"🤖":"👤"}/>

      <div style={{flex:"1 1 0",display:"flex",alignItems:"center",justifyContent:"center",padding:"4px",minHeight:0,position:"relative",background:S.bg}}>
        {showMoves&&(
          <div style={{position:"absolute",inset:0,zIndex:20,background:S.bg+"f2",display:"flex",flexDirection:"column",padding:"12px"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"10px"}}>
              <span style={{color:S.accent,fontSize:"13px",fontWeight:"700"}}>MOVE HISTORY</span>
              <button onClick={()=>setShowMoves(false)} style={{background:"transparent",border:"none",color:S.textSub,cursor:"pointer",fontSize:"20px"}}>✕</button>
            </div>
            <div ref={histRef} style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:"3px"}}>
              {history.length===0&&<div style={{color:S.textSub,textAlign:"center",padding:"24px",fontSize:"13px"}}>No moves yet</div>}
              {Array.from({length:Math.ceil(history.length/2)}).map((_,i)=>{const w=history[i*2],b=history[i*2+1];return <div key={i} style={{display:"flex",gap:"4px",alignItems:"center"}}><span style={{color:S.textSub,fontSize:"12px",width:"24px",textAlign:"right",flexShrink:0}}>{i+1}.</span><button onClick={()=>jumpTo(i*2)} style={{flex:1,padding:"5px 8px",background:histIdx===i*2?S.accent+"22":"transparent",color:histIdx===i*2?S.accent:"#99aacc",border:`1px solid ${histIdx===i*2?S.accent:"transparent"}`,borderRadius:"6px",cursor:"pointer",fontSize:"13px",fontFamily:"monospace",textAlign:"left"}}>{w.alg}</button>{b&&<button onClick={()=>jumpTo(i*2+1)} style={{flex:1,padding:"5px 8px",background:histIdx===i*2+1?S.accent+"22":"transparent",color:histIdx===i*2+1?S.accent:S.textSub,border:`1px solid ${histIdx===i*2+1?S.accent:"transparent"}`,borderRadius:"6px",cursor:"pointer",fontSize:"13px",fontFamily:"monospace",textAlign:"left"}}>{b.alg}</button>}</div>;})}
            </div>
            <div style={{display:"flex",gap:"8px",marginTop:"10px"}}>
              {[["⏮",()=>jumpTo(0)],["◀",()=>jumpTo(histIdx===-1?history.length-2:Math.max(0,histIdx-1))],["▶",()=>{if(histIdx===-1)return;const ni=histIdx+1;ni>=history.length?jumpTo(-1):jumpTo(ni);}],["⏭",()=>jumpTo(-1)]].map(([icon,fn],i)=>(
                <button key={i} onClick={fn} style={{flex:1,padding:"9px",background:S.card,border:`1px solid ${S.border}`,borderRadius:"8px",color:S.accent,cursor:"pointer",fontSize:"16px"}}>{icon}</button>
              ))}
            </div>
            {isReplay&&<button onClick={()=>jumpTo(-1)} style={{marginTop:"8px",padding:"10px",background:S.accent+"22",border:`1px solid ${S.accent}`,borderRadius:"10px",color:S.accent,cursor:"pointer",fontSize:"13px",fontFamily:"inherit"}}>▶ Back to Live</button>}
            {history.length>0&&<button onClick={()=>{setAIdx(0);setShowMoves(false);setScreen("analysis");}} style={{marginTop:"8px",padding:"10px",background:"#cc66cc22",border:"1px solid #cc66cc",borderRadius:"10px",color:"#cc66cc",cursor:"pointer",fontSize:"13px",fontFamily:"inherit"}}>🔬 Analyze Game</button>}
          </div>
        )}
        {vsMode==="online"&&mp.waiting&&(
          <div style={{position:"absolute",inset:0,zIndex:10,background:S.bg+"ee",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"14px"}}>
            <div style={{fontSize:"40px"}}>♟</div>
            <div style={{color:S.accent,fontSize:"16px",fontWeight:"700"}}>Waiting for opponent…</div>
            <div style={{background:S.card,padding:"16px 24px",borderRadius:"12px",border:`1px solid ${S.border}`,textAlign:"center"}}>
              <div style={{color:S.textSub,fontSize:"11px",marginBottom:"6px",letterSpacing:"0.12em"}}>ROOM CODE</div>
              <div style={{fontSize:"28px",fontWeight:"800",letterSpacing:"0.3em",color:S.text}}>{mp.roomCode}</div>
            </div>
            <button onClick={()=>{navigator.clipboard?.writeText(mp.roomCode);setCopied(true);setTimeout(()=>setCopied(false),1500);}} style={{padding:"10px 20px",background:S.accent+"22",border:`1px solid ${S.accent}`,borderRadius:"10px",color:S.accent,cursor:"pointer",fontSize:"13px",fontFamily:"inherit"}}>{copied?"Copied! ✓":"Copy Code"}</button>
          </div>
        )}
        <div style={{width:"min(calc(100vw-8px),calc(100vh-280px),450px)",height:"min(calc(100vw-8px),calc(100vh-280px),450px)",position:"relative"}}>
          {use3D?(
            <Board3D board={board} selected={sel} legalMoves={lm} lastMove={lastMv} onSquareClick={handleSq} flipped={flipped} boardThemeName={boardTheme}/>
          ):(
            <div style={{display:"grid",gridTemplateColumns:showCoords?"14px repeat(8,1fr)":"repeat(8,1fr)",gridTemplateRows:showCoords?"repeat(8,1fr) 14px":"repeat(8,1fr)",width:"100%",height:"100%",boxShadow:`0 2px 20px rgba(0,0,0,0.5),0 0 0 2px ${S.border}`,borderRadius:"4px",overflow:"hidden"}}>
              {showCoords&&rankLabels.map((l,i)=><div key={i} style={{gridColumn:1,gridRow:i+1,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"8px",color:S.textSub,opacity:0.6,userSelect:"none",background:i%2===0?BT2.dark:BT2.light}}>{l}</div>)}
              {[0,1,2,3,4,5,6,7].map((r,ri)=>displayCols.map((c,ci)=>{
                const light=(r+c)%2===0;const isSel=sel?.r===r&&sel?.c===c;const isLeg=lm.some(m=>m.r===r&&m.c===c);const isLast=lastMv&&((lastMv.from?.r===r&&lastMv.from?.c===c)||(lastMv.to?.r===r&&lastMv.to?.c===c));const isChk=isChkSq(r,c);const hp=!!board[r][c];
                let bg=light?BT2.light:BT2.dark;if(isLast)bg=light?"#cdd26a":"#999030";if(isSel)bg=light?"#7fd17f":"#5fb05f";if(isChk)bg="#cc3333";
                const canClick=(col(board[r][c])===turn||isLeg)&&!gameOver&&!aiT&&!isReplay&&(vsMode!=="ai"||turn==="w")&&(vsMode!=="online"||turn===mp.myColor);
                return <div key={`${r}-${c}`} onClick={()=>handleSq(r,c)} style={{gridColumn:showCoords?ci+2:ci+1,gridRow:ri+1,background:bg,display:"flex",alignItems:"center",justifyContent:"center",cursor:canClick?"pointer":"default",position:"relative",WebkitTapHighlightColor:"transparent"}}>
                  {isLeg&&!hp&&<div style={{width:"32%",height:"32%",borderRadius:"50%",background:"rgba(0,0,0,0.22)",pointerEvents:"none"}}/>}
                  {isLeg&&hp&&<div style={{position:"absolute",inset:0,boxShadow:"inset 0 0 0 3px rgba(0,0,0,0.4)",pointerEvents:"none"}}/>}
                  {board[r][c]&&<span style={{fontSize:"min(5.8vw,40px)",lineHeight:1,userSelect:"none",filter:col(board[r][c])==="w"?"drop-shadow(0 1px 2px rgba(0,0,0,0.7))":"drop-shadow(0 1px 1px rgba(255,255,255,0.1))",zIndex:1}}>{GLYPHS[board[r][c]]}</span>}
                </div>;
              }))}
              {showCoords&&fileLabels.map((l,i)=><div key={i} style={{gridColumn:i+2,gridRow:9,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"8px",color:S.textSub,opacity:0.6,userSelect:"none",background:(i+1)%2===0?BT2.dark:BT2.light}}>{l}</div>)}
            </div>
          )}
          {aiT&&<div style={{position:"absolute",bottom:"8px",right:"8px",background:S.bg+"cc",borderRadius:"8px",padding:"4px 10px",color:S.accent,fontSize:"11px",pointerEvents:"none"}}>thinking…</div>}
        </div>
      </div>

      <div style={{height:"26px",display:"flex",alignItems:"center",justifyContent:"center",background:S.panel,borderTop:`1px solid ${S.border}`,borderBottom:`1px solid ${S.border}`,flexShrink:0}}>
        <span style={{fontSize:"12px",fontWeight:gameStatus?"700":"400",color:statusColor,textAlign:"center"}}>
          {isReplay?`Move ${histIdx+1} of ${history.length}`:aiT?"Computer is thinking…":drawOffer?`${drawOffer==="w"?"White":"Black"} offers a draw`:gameStatus||(turn==="w"?"White to move":"Black to move")}
        </span>
      </div>

      <PlayerBar name="You" timeVal={botT} isActive={botActive} isLow={botT<=30} captures={botCap} avatarEmoji={myAvatar.emoji}/>

      <div style={{display:"flex",background:S.panel,borderTop:`1px solid ${S.border}`,flexShrink:0}}>
        {drawOffer&&drawOffer!==turn&&!gameOver?(
          <><button onClick={()=>{sound.over();setGS("Draw by agreement!");vsMode==="online"&&mp.sendDrawAccept();}} style={{flex:1,padding:"13px",background:"transparent",border:"none",borderRight:`1px solid ${S.border}`,color:S.green,cursor:"pointer",fontSize:"13px",fontFamily:"inherit",fontWeight:"600"}}>✓ Accept Draw</button>
          <button onClick={()=>setDrawOffer(null)} style={{flex:1,padding:"13px",background:"transparent",border:"none",color:S.red,cursor:"pointer",fontSize:"13px",fontFamily:"inherit",fontWeight:"600"}}>✕ Decline</button></>
        ):(
          <><button onClick={resetGame} style={{flex:1,padding:"13px",background:"transparent",border:"none",borderRight:`1px solid ${S.border}`,color:S.accent,cursor:"pointer",fontSize:"13px",fontFamily:"inherit",fontWeight:"600"}}>New Game</button>
          {!gameOver&&<button onClick={()=>{if(vsMode==="online"){mp.sendDrawOffer();setDrawOffer(turn);}else{if(drawOffer&&drawOffer!==turn){sound.over();setGS("Draw by agreement!");}else setDrawOffer(turn);}}} style={{flex:1,padding:"13px",background:"transparent",border:"none",borderRight:`1px solid ${S.border}`,color:S.textSub,cursor:"pointer",fontSize:"13px",fontFamily:"inherit"}}>Draw</button>}
          {!gameOver&&<button onClick={()=>{const l=vsMode==="online"?mp.myColor:turn;setGS(l==="w"?"Black wins by resignation!":"White wins by resignation!");vsMode==="online"&&mp.sendResign();}} style={{flex:1,padding:"13px",background:"transparent",border:"none",color:S.red,cursor:"pointer",fontSize:"13px",fontFamily:"inherit"}}>Resign</button>}
          {gameOver&&history.length>0&&<button onClick={()=>{setAIdx(0);setScreen("analysis");}} style={{flex:1,padding:"13px",background:"transparent",border:"none",color:"#cc66cc",cursor:"pointer",fontSize:"13px",fontFamily:"inherit"}}>🔬 Analyze</button>}</>
        )}
      </div>
    </Wrap>
  );
}
