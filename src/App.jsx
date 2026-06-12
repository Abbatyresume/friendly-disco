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
  const refs=useRef({scene:null,renderer:null,cam:null
