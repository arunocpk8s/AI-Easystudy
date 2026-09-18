import config from './playwright.config.js';
export default {...config,webServer:undefined,workers:2,use:{...config.use,baseURL:'https://ai-easystudy.vercel.app'}};
