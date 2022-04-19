export default async function generate(
  req: {
    query: {
      client_id: number
      url_id: number
      template?: string
      type?: string
    }
    cookies: {token: string}
  },
  res: any
) {
  // const {_id, name, email, comment} = JSON.parse(req.body)
  const type = req.query.type || 'pdf'
  const template = req.query.template || 'dashboard'
  const client_id = req.query.client_id
  const url_id = req.query.url_id
  const url = `http://localhost:3341/pdf-template?client_id=${client_id}&url_id=${url_id}`
  const token = req.cookies.token
  const puppeteer = require('puppeteer')
  const browser = await puppeteer.launch()
  //{
  //     args: ['--window-size=1920,1080'],
  //   }
  const page = await browser.newPage()
  await page.setViewport({
    width: 1024,
    height: 768,
    deviceScaleFactor: 2,
  })
  // await page._client.send('Emulation.clearDeviceMetricsOverride')
  const cookies = [
    {
      name: 'access',
      value: token,
      domain: 'localhost',
    },
    {
      name: 'refresh',
      value: token,
      domain: 'localhost',
    },
  ]
  await page.setCookie(...cookies)
  // const cookiesSet = await page.cookies(url);
  await page.goto(url)

  // await page.goto(
  //   ('file://' + __dirname + '/templates/sample.html').replace(
  //     /dist\//,
  //     ''
  //   )
  // )
  // await page.waitForTimeout(2000)
  await page.waitForNetworkIdle()
  await page.emulateMediaType('screen')
  await page.screenshot({path: 'ss.png'})
  const pdfBuffer = await page.pdf({
    printBackground: true,
    // width: '800px',
    // height: '768px',
    // preferCSSPageSize: false,
    // margin: {top: 0, right: 0, bottom: 0, left: 0},
    pageRanges: '1-2',
    // scale:.5
  })

  await browser.close()

  // try {
  //   await client.create({
  //     _type: 'comment',
  //     post: {
  //       _type: 'reference',
  //       _ref: _id,
  //     },
  //     name,
  //     email,
  //     comment,
  //   })
  // } catch (err) {
  //   console.error(err)
  //   return res
  //     .status(500)
  //     .json({message: `Couldn't submit comment`, err})
  // }
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader(
    'Content-Disposition',
    'attachment; filename=dashboard.pdf'
  )
  res.write(pdfBuffer, 'binary')
  res.end()
  // return res.status(200).json({message: 'Comment submitted'})
}
