import {requiredPlan,planRank,planFeatures} from '../public/fitverse/memberships.mjs';
import {trainingPrograms} from '../public/fitverse/training-engine.mjs';
export function membershipOffers(plans,overrides={}){return plans.map(p=>({...p,features:planFeatures[p.id],programs:trainingPrograms.filter(x=>planRank[requiredPlan(x.id)]<=planRank[p.id]&&overrides['train-'+x.id]?.enabled!==false).map(x=>({id:x.id,ar:overrides['train-'+x.id]?.ar||x.ar,en:overrides['train-'+x.id]?.en||x.en,days:x.sessions.length,level:x.level}))}))}
