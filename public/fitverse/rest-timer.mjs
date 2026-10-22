// A deadline, rather than interval ticks, keeps the display correct after tab suspension.
export class RestTimer{
 constructor(now=()=>Date.now()){this.now=now;this.remaining=0;this.deadline=null;}
 start(seconds){if(!Number.isInteger(seconds)||seconds<1||seconds>1800)throw Error('invalid_duration');this.remaining=seconds*1000;this.deadline=this.now()+this.remaining;}
 seconds(){return Math.max(0,Math.ceil((this.deadline===null?this.remaining:this.deadline-this.now())/1000));}
 pause(){this.remaining=this.seconds()*1000;this.deadline=null;}
 resume(){if(this.remaining>0)this.deadline=this.now()+this.remaining;}
 reset(){this.remaining=0;this.deadline=null;}
}
