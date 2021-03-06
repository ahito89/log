Log = window.Log || {}
Log.data = {

  /**
   * Parse log data
   * @param {Object[]=} ent - Log data
   */
  parse(ent = Log.log) {
    let p = []

    // console.log('Log.data.parse()')

    for (let i = 0, l = ent.length; i < l; i++) {
      let es = Log.time.parse(ent[i].s)
      let ee = Log.time.parse(ent[i].e)

      if (Log.time.date(es) !== Log.time.date(ee) && ent[i].e !== 'undefined') {
        let a = Log.time.convert(es)
        let ea = Log.time.convert(ee)

        p.push({
          s: ent[i].s,
          e: Log.time.toHex(new Date(a.getFullYear(), a.getMonth(), a.getDate(), 23, 59, 59)),
          c: ent[i].c,
          t: ent[i].t,
          d: ent[i].d
        })

        p.push({
          s: Log.time.toHex(new Date(ea.getFullYear(), ea.getMonth(), ea.getDate(), 0, 0, 0)),
          e: ent[i].e,
          c: ent[i].c,
          t: ent[i].t,
          d: ent[i].d
        })
      } else {
        p.push(ent[i])
      }
    }

    return p
  },

  /**
   * Get entries
   * @param {Object} d - A date
   * @returns {Object[]} Log entries
   */
  getEntries(d) {
    // console.log('Log.data.getEntries()')
    let ent = []

    if (d === undefined) {
      return Log.log
    } else {
      for (let i = 0, l = Log.log.length; i < l; i++) {
        if (Log.log[i].e === 'undefined') continue

        let a = Log.time.convert(Log.time.parse(Log.log[i].s))

        a.getFullYear() === d.getFullYear()
        && a.getMonth() === d.getMonth()
        && a.getDate() === d.getDate()
        && ent.push(Log.log[i])
      }

      return ent
    }
  },

  /**
   * Sort entries by date
   * @param {Object[]=} ent - Entries
   * @param {Object=} end - End date
   */
  sortEntries(ent = Log.log, end = new Date()) {
    // console.log('Log.data.sortEntries()')
    let days = Log.time.listDates(
      Log.time.convert(Log.time.parse(ent[0].s)),
      end
    )
    let list = []
    let slots = []

    for (let i = 0, l = days.length; i < l; i++) {
      list.push(
        Log.time.date(Log.time.parse(Log.time.toHex(
          new Date(days[i].getFullYear(), days[i].getMonth(), days[i].getDate(), 0, 0, 0)
        )))
      )

      slots.push([])
    }

    for (let o = 0, l = ent.length; o < l; o++) {
      let index = list.indexOf(Log.time.date(Log.time.parse(ent[o].s)))

      if (index > -1) slots[index].push(ent[o])
    }

    return slots
  },

  /**
   * Sort entries by day
   * @returns {Object[]} Entries sorted by day
   */
  sortEntriesByDay() {
    // console.log('Log.data.sortEntriesByDay()')
    let ent = []

    for (let i = 0; i < 7; i++) {
      ent.push(Log.data.getEntriesByDay(i))
    }

    return ent
  },

  /**
   * Get entries from a certain period
   * @param {Object} ps - Period start
   * @param {Object} pe - Period end
   * @returns {Object[]} - Log entries
   */
  getEntriesByPeriod(ps, pe = new Date()) {
    // console.log('Log.data.getEntriesByPeriod()')
    Date.prototype.addDays = function(days) {
      let date = new Date(this.valueOf())
      date.setDate(date.getDate() + days)
      return date
    }

    let getDates = (startDate, stopDate) => {
      let dateArray = []
      let currentDate = startDate

      while (currentDate <= stopDate) {
        dateArray.push(new Date(currentDate))
        currentDate = currentDate.addDays(1)
      }

      return dateArray
    }

    let span = getDates(ps, pe)
    let ent = []

    for (let i = 0, l = span.length; i < l; i++) {
      let a = Log.data.getEntries(span[i])
      for (let o = 0, ol = a.length; o < ol; o++) ent.push(a[o])
    }

    return ent
  },

  /**
   * Get entries from the last n days
   * @param {number} n - The number of days
   * @returns {Object[]} Log entries
   */
  getRecentEntries(n) {
    Date.prototype.subtractDays = function(days) {
      let date = new Date(this.valueOf())
      date.setDate(date.getDate() - days)
      return date
    }

    return Log.data.getEntriesByPeriod((new Date()).subtractDays(n))
  },

  /**
   * Get entries of a specific day of the week
   * @param {number} d - A day of the week (0 - 6)
   * @returns {Object[]} Log entries
   */
  getEntriesByDay(d) {
    let e = []
    let g = ({s}) => Log.time.convert(Log.time.parse(s)).getDay()

    for (let i = 0, l = Log.log.length; i < l; i++) {
      Log.log[i].e !== 'undefined'
      && g(Log.log[i]) === d
      && e.push(Log.log[i])
    }

    return e
  },

  /**
   * Get entries of a specific project
   * @param {string} pro - A project
   * @param {Object[]=} ent - Entries
   * @returns {Object[]} Log entries
   */
  getEntriesByProject(pro, ent = Log.log) {
    let e = []

    for (let i = 0, l = ent.length; i < l; i++) {
      ent[i].e !== 'undefined'
      && ent[i].t === pro
      && e.push(ent[i])
    }

    return e
  },

  /**
   * Get entries of a specific sector
   * @param {string} sec - A sector
   * @param {Object[]=} ent - Entries
   * @returns {Object[]} Log entries
   */
  getEntriesBySector(sec, ent = Log.log) {
    let e = []

    for (let i = 0, l = ent.length; i < l; i++) {
      ent[i].e !== 'undefined'
      && ent[i].c === sec
      && e.push(ent[i])
    }

    return e
  },

  /**
   * List projects
   * @param {Object[]=} a - Log entries
   * @returns {Object[]} A list of projects
   */
  listProjects(a = Log.log) {
    let p = []

    let check = ({e, t}) => {
      e !== 'undefined'
      && p.indexOf(t) === -1
      && p.push(t)
    }

    for (let i = 0, l = a.length; i < l; i++) {
      check(a[i])
    }

    return p
  },

  /**
   * List sectors
   * @param {Object[]=} ent - Entries
   * @returns {Object[]} A list of sectors
   */
  listSectors(ent = Log.log) {
    let l = []

    let check = ({e, c}) => {
      e !== 'undefined'
      && l.indexOf(c) === -1
      && l.push(c)
    }

    for (let i = 0, l = ent.length; i < l; i++) {
      check(ent[i])
    }

    return l
  },

  /**
   * Get peak days
   * @param {Object[]=} a - Log entries
   * @returns {Object[]} Peak days
   */
  peakDays(a = Log.log) {
    let d = [0, 0, 0, 0, 0, 0, 0]
    let count = ({s}) => {
      d[(Log.time.convert(Log.time.parse(s))).getDay()]++
    }

    for (let i = 0, l = a.length; i < l; i++) {
      a[i].e !== 'undefined' && count(a[i])
    }

    return d
  },

  /**
   * Get peak day
   * @param {Object[]=} a - Entries
   * @returns {string} Peak day
   */

  peakDay(a = Log.log) {
    let eph = Log.data.peakDays(a)
    let mph = 0
    let mpht = 0

    for (let i = 0, l = eph.length; i < l; i++) {
      eph[i] > mph && (mph = eph[i], mpht = i)
    }

    return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][mpht]
  },

  /**
   * Get peak hours
   * @param {Object[]=} a - Log entries
   * @returns {Object[]} Peak hours
   */

  peakHours(a = Log.log) {
    let h = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
    let count = ({s, e}) => {
      let es = Log.time.parse(s)
      h[(Log.time.convert(es)).getHours()] += Log.time.duration(es, Log.time.parse(e))
    }

    for (let i = 0, l = a.length; i < l; i++) {
      a[i].e !== 'undefined' && count(a[i])
    }

    return h
  },

  /**
   * Get peak hour
   * @param {Object[]=} a - Entries
   * @returns {string} Peak hour
   */
  peakHour(a = Log.log) {
    let eph = Log.data.peakHours(a)
    let mph = 0
    let mpht = 0

    for (let i = 0, l = eph.length; i < l; i++) {
      eph[i] > mph && (mph = eph[i], mpht = i)
    }

    return `${mpht}:00`
  },

  /**
   * List durations
   * @param {Object[]=} ent - Entries
   * @returns {Object[]} List of durations
   */
  listDurations(ent = Log.log) {
    let dur = []

    let add = ({s, e}) => {
      dur.push(Log.time.duration(Log.time.parse(s), Log.time.parse(e)))
    }

    for (let i = 0, l = ent.length; i < l; i++) {
      ent[i].e !== 'undefined' && add(ent[i])
    }

    return dur
  },

  /**
   * Calculate shortest log session
   * @param {Object[]=} a - Log entries
   * @returns {number} Shortest log session
   */
  lsmin(a = Log.log) {
    if (a.length === 0) return 0

    let dur = Log.data.listDurations(a)
    let m

    for (let i = 0, l = dur.length; i < l; i++) {
      if (dur[i] < m || m === undefined) m = dur[i]
    }

    return m
  },

  /**
   * Calculate longest log session
   * @param {Object[]=} ent - Entries
   * @returns {number} Longest log session
   */
  lsmax(ent = Log.log) {
    if (ent.length === 0) return 0

    let dur = Log.data.listDurations(ent)
    let m = 0

    for (let i = 0, l = dur.length; i < l; i++) {
      if (dur[i] > m) m = dur[i]
    }

    return m
  },

  /**
   * Calculate average session duration (ASD)
   * @param {Object[]=} ent - Entries
   * @returns {number} Average session duration
   */
  asd(ent = Log.log) {
    if (ent.length === 0) return 0

    let dur = Log.data.listDurations(ent)
    let avg = 0
    let c = 0

    for (let i = 0, l = dur.length; i < l; i++) {
      avg += dur[i]
      c++
    }

    return avg / c
  },

  /**
   * Calculate the total number of logged hours
   * @param {Object[]=} ent - Entries
   * @returns {number} Total logged hours
   */
  lh(ent = Log.log) {
    if (ent.length === 0) return 0

    let dur = Log.data.listDurations(ent)
    let h = 0

    for (let i = 0, l = dur.length; i < l; i++) {
      h += dur[i]
    }

    return h
  },

  /**
   * Calculate average logged hours
   * @param {Object[]=} ent - Entries
   * @returns {number} Average logged hours
   */
  avgLh(ent = Log.log) {
    if (ent.length === 0) return 0

    let list = Log.data.sortEntries(ent)
    let h = 0

    for (let i = 0, l = list.length; i < l; i++) {
      h += Log.data.lh(list[i])
    }

    return h / list.length
  },

  /**
   * Calculate how much of a time period was logged
   * @param {Object[]=} ent - Entries
   * @returns {number} Log percentage
   */
  lp(ent = Log.log) {
    if (ent.length === 0) return 0

    let e = Log.time.convert(Log.time.parse(ent[0].s))
    let d = Log.time.convert(Log.time.parse(ent[ent.length - 1].s))
    let h = Number(Log.data.lh(ent))
    let n = Math.ceil((
              new Date(d.getFullYear(), d.getMonth(), d.getDate()) -
              new Date(e.getFullYear(), e.getMonth(), e.getDate())
            ) / 8.64e7)

    return h / (24 * (n + 1)) * 100
  },

  /**
   * Calculate sector hours
   * @param {Object[]=} ent - Entries
   * @param {string} sec - Sector
   * @returns {number} Sector hours
   */
  sh(sec, ent = Log.log) {
    if (ent.length === 0) return 0

    let h = 0

    let count = ({s, e}) => {
      h += Log.time.duration(Log.time.parse(s), Log.time.parse(e))
    }

    for (let i = 0, l = ent.length; i < l; i++) {
      ent[i].e !== 'undefined'
      && ent[i].c === sec
      && count(ent[i])
    }

    return h
  },

  /**
   * Calculate sector percentage
   * @param {Object[]=} ent - Entries
   * @param {string} sec - Sector
   * @returns {number} Sector percentage
   */
  sp(sec, ent = Log.log) {
    return Log.data.sh(sec, ent) / Log.data.lh(ent) * 100
  },

  /**
   * Calculate project hours
   * @param {Object[]=} ent - Entries
   * @param {string} pro - Project
   * @returns {number} Project hours
   */
  ph(pro, ent = Log.log) {
    let h = 0

    let d = ({s, e}) => Number(Log.time.duration(Log.time.parse(s), Log.time.parse(e)))

    for (let i = 0, l = ent.length; i < l; i++) {
      ent[i].e !== 'undefined'
      && ent[i].t === pro
      && (h += d(ent[i]))
    }

    return h
  },

  /**
   * Calculate project percentage
   * @param {Object[]=} ent - Entries
   * @param {string} pro - Project
   * @returns {number} Project percentage
   */
  pp(pro, ent = Log.log) {
    return Log.data.ph(pro, ent) / Log.data.lh(ent) * 100
  },

  /**
   * Calculate trend
   * @param {number} a
   * @param {number} b
   * @returns {number} Trend
   */
  trend(a, b) {
    return (a - b) / b * 100
  },

  /**
   * Calculate streak
   * @param {Object[]=} a - Entries
   * @returns {number} Streak
   */
  streak(a = Log.log) {
    let ent = Log.data.sortEntries(a)
    let streak = 0

    for (let i = 0, l = ent.length; i < l; i++) {
      streak = ent[i].length === 0 ? 0 : streak + 1
    }

    return streak
  },

  /**
   * Get an array of focus stats
   * @param {Object[]=} ent - Entries
   * @returns {Object[]} Array of focus stats
   */
  listFocus(ent = Log.log) {
    let days = Log.data.sortEntries(ent)
    let foc = []

    for (let i = 0, l = days.length; i < l; i++) {
      foc.push(Log.data.projectFocus(days[i]))
    }

    return foc
  },

  /**
   * Calculate sector focus
   */
  sectorFocus(ent = Log.log) {
    return 1 / Log.data.listSectors(ent).length
  },

  /**
   * Calculate project focus
   */
  projectFocus(ent = Log.log) {
    return 1 / Log.data.listProjects(ent).length
  },

  /**
   * Calculate minimum focus
   * @param {Object[]=} ent - Entries
   */
  minFocus(ent = Log.log) {
    if (ent.length === 0) return 0

    let list = Log.data.listFocus(ent)
    let m

    for (let i = 0, l = list.length; i < l; i++) {
      if (list[i] < m || m === undefined) m = list[i]
    }

    return m
  },

  /**
   * Calculate maximum focus
   * @param {Object[]=} ent - Entries
   */
  maxFocus(ent = Log.log) {
    if (ent.length === 0) return 0

    let list = Log.data.listFocus(ent)
    let m = 0

    for (let i = 0, l = list.length; i < l; i++) {
      if (list[i] > m) m = list[i]
    }

    return m
  },

  /**
   * Calculate average focus
   * @param {Object[]=} ent - Entries
   */
  focusAvg(ent = Log.log) {
    let set = Log.data.listSectors(ent)
    let avg = 0

    for (let i = 0, l = set.length; i < l; i++) {
      let e = Log.data.getEntriesBySector(set[i]).length
      avg += Log.data.sh(set[i], ent) * (Log.data.sp(set[i], ent) / 100)
    }

    return avg / Log.data.lh(ent)
  },

  forecast: {

    /**
     * Forecast sector focus
     */
    sf() {
      let ent = Log.data.getEntriesByDay(new Date().getDay())
      let s = Log.data.listSectors(ent)
      let sf = 0
      let sfs = ''

      for (let i = 0, l = s.length; i < l; i++) {
        let x = Log.data.sp(s[i], ent)
        x > sf && (sf = x, sfs = s[i])
      }

      return sfs
    },

    /**
     * Forecast project focus
     * @returns {string} Project focus
     */
    pf() {
      let ent = Log.data.getEntriesByDay(new Date().getDay())
      let p = Log.data.listProjects(ent)
      let pf = 0
      let pfp = ''

      for (let i = 0, l = p.length; i < l; i++) {
        let x = Log.data.pp(p[i], ent)
        x > pf && (pf = x, pfp = p[i])
      }

      return pfp
    },

    /**
     * Forecast peak time
     * @returns {string} Peak time
     */
    pt() {
      let ent = Log.data.getEntriesByDay(new Date().getDay())
      let eph = Log.data.peakHours(ent)
      let mph = 0
      let mpht = 0

      for (let i = 0, l = eph.length; i < l; i++) {
        eph[i] > mph && (mph = eph[i], mpht = i)
      }

      return `${mpht}:00`
    },

    /**
     * Forecast session duration
     * @returns {number} Session duration
     */
    sd() {
      return Log.data.asd(Log.data.getEntriesByDay(new Date().getDay()))
    },

    smoothForecast(lastForecast, lastActual, smoothingConstant = 0.5) {
      return lastForecast + (smoothingConstant * (lastActual - lastForecast))
    },

    smoothTrend() {
      let ent = Log.log
      let forecasts = []

      for (let i = 0, l = ent.length; i < l; i++) {
        let e = ent[i]
        let es = Log.time.parse(e.s)
        let ee = Log.time.parse(e.e)
        let duration = Log.time.duration(es, ee)

        let lastForecast
        if (forecasts.length === 0) {
          lastForecast = duration
        } else {
          lastForecast = forecasts[forecasts.length - 1]
        }

        forecasts.push(Log.data.forecast.smoothForecast(lastForecast, duration))
      }

      console.log(forecasts)

      Log.vis.forecastBar('forecastChart', forecasts)

    }
  }
}
