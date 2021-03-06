const ChartjsNode = require('chartjs-node')
const axios = require('axios')
const moment = require('moment')
const path = require('path')
const concat = require('concat-stream')
const cloudinary = require('cloudinary')

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

const getTimePeriod = () => {
  const timePeriod = [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12 ].reduce((previous, month) => {
    const key = moment().subtract(month - 1, 'months').format('MMM/YYYY')

    return {
      ...previous,
      [key]: 0
    }
  }, {})

  return timePeriod
}

const buildNewJobsDatasource = issues => {
  const timePeriod = getTimePeriod()

  const data = issues.reduce((previous, issue) => {
    const key = moment(issue.created_at).format('MMM/YYYY')

    const previousKeyValue = previous[key]

    return {
      ...previous,
      [key]: previousKeyValue + 1
    }
  }, timePeriod)

  return data
}

const buildOpenJobsDatasource = issues => {
  const timePeriod = getTimePeriod()

  const data = issues.reduce((previous, issue) => {
    const key = moment(issue.created_at).format('MMM/YYYY')
    const [ month, year ] = moment(issue.created_at).format('MM/YYYY').split('/')

    const currentDateLimit = moment(`${year}-${month}-1`, "YYYY-MM-D").endOf('month')

    const previousKeyValue = previous[key]
    const openJobs =
      issues
        .filter(issue => issue.closed_at === null)
        .filter(issue => {
          const date = moment(issue.created_at)
          const diff = date.diff(currentDateLimit)

          return diff <= 0
        })
        .length

    return {
      ...previous,
      [key]: openJobs
    }
  }, timePeriod)

  return data
}

const buildDatasource = issues => {
  const newJobs = buildNewJobsDatasource(issues)

  return {
    newJobs
  }
}

const buildChartOptions = data => {
  const labels = Object.keys(data.newJobs).reverse()
  const newJobs = Object.values(data.newJobs).reverse()

  return {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "# of new job posts",
          data: newJobs,
          backgroundColor: "rgba(0, 255, 0, 0.2)",
          borderColor: "rgba(0, 255, 0, 1)",
          borderWidth: 1
        }
      ]
    },
    options: {
      title: {
        display: true,
        text: 'Job posts history @elmjobs_'
      },
      scales: {
        yAxes: [{
          ticks: {
            beginAtZero: true,
            stepSize: 1
          }
        }]
      }
    }
  }
}

const buildChart = chartOptions => {
  const chartNode = new ChartjsNode(1000, 500)
  const imagePath = path.join(__dirname, 'tmp', 'chart.png')

  return chartNode.drawChart(chartOptions)
    .then(() => chartNode.getImageBuffer('image/png'))
    .then(buffer => chartNode.getImageStream('image/png'))
    .then(streamResult => {
      let imgStr = ''
      let cs = concat(buffer => {
        imgStr = buffer.toString('base64')
        imgStr = `data:image/png;base64,${imgStr}`

        cloudinary.uploader.upload(imgStr, console.log, {
          public_id: 'chart',
          use_filename: true,
          unique_filename: false,
          invalidate: true
        })
      })

      streamResult.stream.pipe(cs)
    })
    .then(() => console.log(`Chart built at ${moment().format('DD/MM/YYYY')}`))
}

module.exports = () => {
  return axios.get('https://api.github.com/repos/fidelisclayton/elm-jobs/issues?state=all')
    .then(({ data }) => data)
    .then(buildDatasource)
    .then(buildChartOptions)
    .then(buildChart)
    .catch(error => {
      console.log('error', error)

      return new Error(error)
    })
}
