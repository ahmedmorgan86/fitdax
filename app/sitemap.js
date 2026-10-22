import {site,publicPages} from '../lib/site.mjs';
export default function sitemap(){return publicPages.map(p=>({url:site+p.path,lastModified:'2026-10-22',changeFrequency:'weekly',priority:p.path==='/'?1:.9,alternates:{languages:{ar:site+'/',en:site+'/en'}}}));}
