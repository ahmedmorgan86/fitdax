import {site} from '../lib/site.mjs';
export default function robots(){return {rules:{userAgent:'*',allow:'/',disallow:['/api/','/auth/']},sitemap:site+'/sitemap.xml',host:site};}
