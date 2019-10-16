const puppeteer = require('puppeteer');
const {
    TimeoutError
} = require('puppeteer/Errors');
const cheerio = require('cheerio');
const fs = require('fs')
const xlsx = require('node-xlsx')
const json2xls = require('json2xls')

const arr = [];
const linkList = [];
const reg = /美联/;
const regAca = /acadsoc/;
let n = 0;
let nn = 0;
const pageSize = 10;
const kw = "美联英语贵吗";

/*let obj = xlsx.parse(__dirname+'/test.xlsx')
let excelObj=obj[0].data;
console.log(excelObj)
var data = [];
for(var i in excelObj){
    var arr=[];
    var value=excelObj[i];
    for(var j in value){
        arr.push(value[j]);
    }
    data.push(arr);
}
var buffer = xlsx.build([
    {
        name:'sheet1',
        data:data
    }        
]);
fs.writeFileSync('test1.xlsx',buffer,{'flag':'w'});*/

(async () => {
    console.log("运行开始")
    const browser = await puppeteer.launch({
        headless: false
    });
    const page = await browser.newPage();


    for (let i = 1; i <= pageSize; i++) {
        //mb
        await page.goto(`https://m.baidu.com/s?word=${kw}&pn=${(i-1) + "0"}`);
        const content = await page.content();
        const $ = cheerio.load(content, {
            decodeEntities: false
        });
        $('.results .result').each((index, el) => {
            const title = $(el).find('h3 span').text();
            const link = $(el).find('a').attr("href");
            if (reg.test(title)) {
                n++;
                //arr.push(`${n}、页码（${i}）、${title}、${link}`)
                arr.push({
                    '序号': n,
                    '搜素关键词': kw,
                    //'阿卡索站群/论坛':'',
                    '当前页数': i,
                    '页面标题': title,
                    'URL': link
                })
            }
        });
    }

    console.log(`找到共计${arr.length}个页面`);
    //console.log(arr)
    for (let i = 0; i < arr.length; i++) {
        const page2 = await browser.newPage();
        await page2.setViewport({
            width: 1920,
            height: 1080
        });
        await page2.setRequestInterception(true);     // 设为true 开启    false 关闭
        page2.on('request', interceptedRequest => {
            //判断如果是 图片请求  就直接拦截
            if (interceptedRequest.url().endsWith('.png') || interceptedRequest.url().endsWith('.jpg')||interceptedRequest.url().endsWith('.gif'))
                interceptedRequest.abort();   //终止请求
            else
                interceptedRequest.continue();//弹出
        });

        //const arrTemp = arr[i].split("、");
        const arrTemp = arr
        try {
            //await page2.goto(arrTemp[3], {timeout: 0});
            await page2.goto(arrTemp[i]['URL'])
            const content = await page2.content();
            console.log(i)
            if (regAca.test(content)) {
                nn++
                // arrTemp[3] = await page2.url();
                // arrTemp[0] = nn;
                arrTemp[i]['URL'] = await page2.url();
                arrTemp[i]['序号'] = nn;
                //linkList.push(arrTemp.join("、"))
                linkList.push(arrTemp[i])
                console.log(`找到啦~~~${await page2.url()}`)

            }
        } catch (e) {
            console.log(e)
            if (e instanceof TimeoutError) {
                // 如果超时，做一些处理。
                console.log("超时");
                continue
            }
        }

        await page2.close();
    }

    console.log(linkList);

    //fs读写入一个新的json文件
    // fs.writeFile('./index.json', JSON.stringify(linkList), {
    //     flag: "a"
    // }, function (err) {
    //     if (err) {
    //         return console.log(err);
    //     } else {
    //         console.log("写入成功");
    //     }
    // })

    const xls = json2xls(linkList);
    fs.writeFileSync('test-m.xlsx', xls, 'binary');

    await browser.close();

    console.log("运行完成")
})()