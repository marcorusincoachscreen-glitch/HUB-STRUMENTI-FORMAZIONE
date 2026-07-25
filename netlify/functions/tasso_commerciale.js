// =========================================================================
// MOTORE DI CALCOLO — Libere Scelte Cliente (Tasso Commerciale)
// Copia esatta del motore di calc() originale (sezione pura, senza DOM),
// spostata lato server. Il browser manda solo i valori inseriti.
// =========================================================================
function PMT(t,e,n){return 0===t?n/e:n*t*Math.pow(1+t,e)/(Math.pow(1+t,e)-1)}
function ROUNDUP(t){return Math.ceil(t)}
function RATE(t,e,n){let i=.01;for(let o=0;o<300;o++){const o=n*Math.pow(1+i,t)+e*(Math.pow(1+i,t)-1)/i,a=n*t*Math.pow(1+i,t-1)+e*(t*i*Math.pow(1+i,t-1)-(Math.pow(1+i,t)-1))/(i*i);if(Math.abs(a)<1e-12)break;const m=i-o/a;if(Math.abs(m-i)<1e-10){i=m;break}i=m}return i}
function CUMPRINC(t,e,n,i,o){const a=PMT(t,e,n);let m=0,s=n;for(let n=1;n<=e;n++){const e=a-s*t;n>=i&&n<=o&&(m+=e),s-=e}return m}
function CUMIPMT(t,e,n,i,o){const a=PMT(t,e,n);let m=0,s=n;for(let n=1;n<=e;n++){const e=s*t;n>=i&&n<=o&&(m+=e),s-=a-e}return m}

function computeAll(inputs){
const t=inputs.prezzoAcquisto,e=inputs.anticipo,n=inputs.extraSconto,i=Math.max(1,Math.round(inputs.durata)),o=inputs.assicurazioniInt,a=inputs.manutenzioneInt,m=inputs.assicurazioniExt,s=inputs.manutenzioneExt,c=inputs.usciteExtra,r=inputs.usciteExtraContantista,l=inputs.aperturaPratica,f=inputs.incassoRata,d=inputs.tanPassivo/100,u=inputs.tanAttivo/100,C=Math.max(1,Math.round(inputs.meseEstinzione)),y=inputs.storni,E=inputs.valoreUsatoPct/100,g=inputs.iperValutazione,I=o+a+m+s+c,B=t+o+a+l-e-n,p=ROUNDUP(PMT(d/12,i,B)),x=p+f,D=x+(m+s)/i,M=B,P=C<i?CUMPRINC(d/12,i,M,C+1,i):0,A=t*E,T=P-A-g,b=.74*((t-e)*Math.pow(1+u,C/12)-(t-e)),h=.74*(t*Math.pow(1+u,C/12)-t),z=CUMIPMT(d/12,i,M,1,Math.min(C,i)),L=CUMPRINC(d/12,i,M,1,Math.min(C,i)),R=e+x*C+m+s+c-b-y,U=R/C,w=e+m+s+c+x*C+g-b+P+.01*P-g-y;let F;F=0===P?-A:P-A<0?0:P-A;const G=R+F+.01*(1.01*P),N=R+P-A-g+.01*P,S=t+o+a+m+s+c-y-b,S2=t-A+o+a+m+s+c-y-b,opGiorno7=(R-S2)/(30*C),O=(w-S)/(30*i),q=(G-S2)/(30*C),_=(N-S2)/(30*C),k=w-N,H=0!==N?k/N*100:0,K=G-N,j=0!==N?K/N*100:0,J=inputs.tanRifinanziamento/100,Q=Math.max(1,Math.round(inputs.durataRifinanziamento)),W=1.01*P,X=PMT(J/12,Q,W),Y=X*Q,Z=Y-W,$=e+m+s+c+x*C-b-y+Y,tt=($-S)/(30*i),et=$-N,nt=0!==N?et/N*100:0,it=t+o+m+a+s+c+r+h-y-A,ot=it-N,at=0!==N?ot/N*100:0,mt=e+x*i+m+s+c-y-b,st=mt-N,ct=0!==N?st/N*100:0,rt=(mt-S)/(30*i),lt=12*RATE(i,-(x-f),t-e+o+a+l),ft=t-e+o+a+l;let dt=1/0,ut=NaN;for(let t=0;t<315;t++){const n=.01+5e-4*t,o=n/12,a=CUMPRINC(o,i,ft,1,Math.min(C,i)),r=CUMIPMT(o,i,ft,1,Math.min(C,i)),l=C<i?CUMPRINC(o,i,ft,C+1,i):0,d=w-(e+a+r+f*C+1.01*l-b-y+m+s+c);d>0&&d<dt&&(dt=d,ut=n)}
  return {t,e,n,i,o,a,m,s,c,r,l,f,d,u,C,y,E,g,I,B,p,x,D,M,P,A,T,b,h,z,L,R,U,w,F,G,N,S,S2,opGiorno7,O,q,_,k,H,K,j,J,Q,W,X,Y,Z,$,tt,et,nt,it,ot,at,mt,st,ct,rt,lt,ft,dt,ut};
}

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }
  try {
    const inputs = JSON.parse(event.body || '{}');
    const result = computeAll(inputs);
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(result) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: String(e) }) };
  }
};

module.exports.computeAll = computeAll;
