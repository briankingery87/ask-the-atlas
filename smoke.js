/* Offline smoke test: run the real page in Chromium with mocked AGOL responses.
   Verifies that all four modes render without JS errors and that placeholder
   handling, sorting, scoring and the drawer all behave. */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const mkTeam = (o) => Object.assign({
  team_id:1, school:'Test', mascot:'Testers', abbreviation:'TST', conference:'Big Ten', division:'FBS',
  data_tier:'Full', venue_name:'Test Field', city:'Testville', state:'OH', zip_code:'43210', timezone:'America/New_York',
  capacity:50000, elevation_m:200, dome:0, grass:1, year_built:1925, latitude:40, longitude:-83,
  primary_color:'#CE1141', secondary_color:'#505056', text_color:'#FFFFFF',
  logo_url:'http://a.espncdn.com/i/teamlogos/ncaa/500/194.png', head_coach:'A Coach',
  ap_rank:-1, coaches_rank:-1, cfp_rank:-1, fpi:-999, sp_rating:-999, elo:-999, talent:-999,
  recruiting_rank:-1, recruiting_pts:-999, record_2025:'8-4', final_rank_2025:-1, natl_champ_2025:0,
  history_str:'2025^8-4^-1~2024^9-3^18~2023^7-5^-1~2022^10-2^9~2021^6-6^-1',
  schedule_str:'1^Ball State^vs^Sep 5^BTN^~2^Michigan^at^Sep 12^ABC^',
  rank_label:'2026 Week 1', travel_gc_miles:-1, travel_div_rank:-1, travel_div_count:-1, travel_conf_avg:-1,
  rival_school:'N/A', rival_logo_url:'N/A', next_opp:'Ball State', next_loc:'vs', next_date:'Sep 5', next_tv:'BTN',
  stamp_updated: Date.now() - 2*86400000
}, o);

const TEAMS = [
  mkTeam({team_id:194, school:'Ohio State', mascot:'Buckeyes', coaches_rank:1, fpi:28.7, recruiting_rank:4,
          record_2025:'12-2', capacity:102780, travel_gc_miles:4426.7, travel_div_rank:43, travel_conf_avg:4153,
          rival_school:'Michigan', latitude:40.0017, longitude:-83.0197,
          history_str:'2025^12-2^5~2024^14-2^1~2023^11-2^10~2022^11-2^4~2021^11-2^6',
          schedule_str:'1^Ball State^vs^Sep 5^BTN^~2^Texas^at^Sep 12^ABC^~13^Michigan^vs^Nov 28^FOX^'}),
  mkTeam({team_id:130, school:'Michigan', mascot:'Wolverines', coaches_rank:9, fpi:21.3, recruiting_rank:11,
          record_2025:'9-4', capacity:107601, primary_color:'#00274C', secondary_color:'#FFCB05',
          travel_gc_miles:3800, rival_school:'Ohio State', latitude:42.2658, longitude:-83.7487}),
  mkTeam({team_id:2229, school:'Ferris State', mascot:'Bulldogs', division:'D2', conference:'GLIAC', state:'MI',
          capacity:10000, fpi:-999, recruiting_rank:-1, elevation_m:-1, primary_color:'#C8102E',
          latitude:43.68, longitude:-85.48, record_2025:'16-0', rival_school:'N/A',
          history_str:'2025^16-0^-1~2024^14-1^-1', schedule_str:'N/A - no schedule'}),
  mkTeam({team_id:2483, school:'Wyoming', mascot:'Cowboys', conference:'Mountain West', state:'WY', capacity:29181,
          elevation_m:2192, year_built:1950, latitude:41.31, longitude:-105.57, travel_gc_miles:5400,
          primary_color:'#492F24', secondary_color:'#FFC425', dome:0, grass:0}),
  mkTeam({team_id:9999, school:'Wisconsin-River Falls', mascot:'Falcons', division:'D3', conference:'WIAC', state:'WI',
          capacity:-1, elevation_m:-1, year_built:-1, latitude:44.85, longitude:-92.63,
          primary_color:'#B01E24', record_2025:'15-0', schedule_str:'N/A - no schedule',
          history_str:'N/A'})
];

const EMPIRES = [
  {team_id:194, school:'Ohio State', counties:120, population:9800000, pop_share_us:0.03, avg_share:0.41,
   pop_rank:3, county_rank:5, states_touched:4, battlegrounds:19, top_county:'Franklin County, OH',
   headline:'The Buckeye Republic', story:'Ohio State holds the state outright.',
   max_empire_pop:21500000, max_empire_counties:180, n_empires:110, n_landless_fbs:22},
  {team_id:130, school:'Michigan', counties:88, population:6100000, pop_share_us:0.018, avg_share:0.38,
   pop_rank:8, county_rank:12, states_touched:3, battlegrounds:14, top_county:'Wayne County, MI',
   headline:'The Big House reach', story:'Michigan holds the lower peninsula.',
   max_empire_pop:21500000, max_empire_counties:180, n_empires:110, n_landless_fbs:22}
];

const GAMES = [
  {game_id:1, season:2026, week:1, season_type:'regular', start_date:Date.now()+86400000,
   kickoff_str:'Sat Aug 29, 12:00 PM', tv_outlet:'FOX', venue:'Ohio Stadium', host_city:'Columbus', host_state:'OH',
   capacity:102780, neutral_site:0, conf_game:0, completed:0, matchup:'Michigan at Ohio State', data_tier:'Full',
   spread:-3.5, over_under:54.5, line_str:'Ohio State -3.5', line_provider:'consensus', hot_take:'Pending',
   home_team_id:194, home_school:'Ohio State', home_mascot:'Buckeyes', home_conf:'Big Ten', home_division:'FBS',
   home_rank:-1, home_rank25:5, home_record25:'12-2', home_sp:-999, home_elo:-999, home_fpi:28.7,
   home_logo_url:'http://a.espncdn.com/i/teamlogos/ncaa/500/194.png', home_color:'#CE1141', home_text_on:'#FFFFFF', home_coach:'Ryan Day', home_points:-1,
   away_team_id:130, away_school:'Michigan', away_mascot:'Wolverines', away_conf:'Big Ten', away_division:'FBS',
   away_rank:-1, away_rank25:9, away_record25:'9-4', away_sp:-999, away_elo:-999, away_fpi:21.3,
   away_logo_url:'http://a.espncdn.com/i/teamlogos/ncaa/500/130.png', away_color:'#00274C', away_text_on:'#FFCB05', away_coach:'A Coach', away_points:-1,
   _geom:{x:-83.0197,y:40.0017}},
  {game_id:2, season:2026, week:1, start_date:Date.now()+2*86400000, kickoff_str:'TBD', tv_outlet:'N/A',
   venue:'War Memorial', host_city:'Laramie', host_state:'WY', capacity:29181, neutral_site:0, conf_game:1,
   completed:0, matchup:'Ferris State at Wyoming', data_tier:'Full', spread:-999, over_under:-999, line_str:'N/A',
   line_provider:'N/A', hot_take:'Pending',
   home_team_id:2483, home_school:'Wyoming', home_mascot:'Cowboys', home_conf:'Mountain West', home_division:'FBS',
   home_rank:-1, home_rank25:-1, home_record25:'6-6', home_sp:-999, home_elo:-999, home_fpi:-999,
   home_logo_url:'N/A', home_color:'#492F24', home_text_on:'#FFFFFF', home_coach:'N/A', home_points:-1,
   away_team_id:2229, away_school:'Ferris State', away_mascot:'Bulldogs', away_conf:'GLIAC', away_division:'D2',
   away_rank:-1, away_rank25:-1, away_record25:'16-0', away_sp:-999, away_elo:-999, away_fpi:-999,
   away_logo_url:'N/A', away_color:'#C8102E', away_text_on:'#FFFFFF', away_coach:'N/A', away_points:-1,
   _geom:{x:-105.5686,y:41.3114}},
  {game_id:3, season:2026, week:1, start_date:Date.now()+2*86400000, kickoff_str:'Sat Aug 29, 08:00 PM',
   tv_outlet:'ESPN', venue:'Neutral Dome', host_city:'Dublin', host_state:'N/A', capacity:51700, neutral_site:1,
   conf_game:0, completed:0, matchup:'Michigan vs Wyoming', data_tier:'Full', spread:-14, over_under:61.5,
   line_str:'Michigan -14.0', line_provider:'consensus', hot_take:'Pending',
   home_team_id:130, home_school:'Michigan', home_mascot:'Wolverines', home_conf:'Big Ten', home_division:'FBS',
   home_rank:-1, home_rank25:9, home_record25:'9-4', home_sp:-999, home_elo:-999, home_fpi:21.3,
   home_logo_url:'N/A', home_color:'#00274C', home_text_on:'#FFCB05', home_coach:'A Coach', home_points:-1,
   away_team_id:2483, away_school:'Wyoming', away_mascot:'Cowboys', away_conf:'Mountain West', away_division:'FBS',
   away_rank:-1, away_rank25:-1, away_record25:'6-6', away_sp:-999, away_elo:-999, away_fpi:-999,
   away_logo_url:'N/A', away_color:'#492F24', away_text_on:'#FFFFFF', away_coach:'N/A', away_points:-1,
   _geom:{x:-6.26,y:53.34}}
];

const COUNTY = {
  NAME:'Franklin', county_name:'Franklin County', STATE_NAME:'Ohio', STATE_ABBR:'OH', POPULATION:1323807,
  dominant_team_id:194, dominant_school:'Ohio State', dominant_mascot:'Buckeyes', dominant_share:0.63,
  second_team_id:130, second_school:'Michigan', second_mascot:'Wolverines', gap:0.41,
  dominant_color_hex:'#CE1141', second_color_hex:'#00274C', text_on_dominant:'#FFFFFF', text_on_second:'#FFCB05',
  dominant_logo_url:'http://a.espncdn.com/i/teamlogos/ncaa/500/194.png', second_logo_url:'N/A',
  headline:'Buckeye heartland', story:'Franklin County is the modeled core of the Ohio State empire.',
  max_dominant_share:0.92
};

const RANKINGS = [
  /* WEEK 1 - the preseason release. Must NOT appear on the board when week 2 exists,
     and must not pin a team's rank pill to its preseason number. */
  {season:2026, week:1, poll:'AP Top 25', rank:3, team_id:194, school:'Ohio State', conference:'Big Ten', points:1400, first_votes:2},
  {season:2026, week:1, poll:'AP Top 25', rank:12, team_id:130, school:'Michigan', conference:'Big Ten', points:800, first_votes:0},
  {season:2026, week:1, poll:'Coaches Poll', rank:4, team_id:194, school:'Ohio State', conference:'Big Ten', points:1500, first_votes:1},
  {season:2026, week:1, poll:'AFCA Division II Coaches Poll', rank:2, team_id:2229, school:'Ferris State', conference:'GLIAC', points:450, first_votes:3},
  /* WEEK 2 - the latest release, and the one the home strip must open on */
  {season:2026, week:2, poll:'AP Top 25', rank:1, team_id:194, school:'Ohio State', conference:'Big Ten', points:1550, first_votes:60},
  {season:2026, week:2, poll:'AP Top 25', rank:7, team_id:130, school:'Michigan', conference:'Big Ten', points:1100, first_votes:0},
  {season:2026, week:2, poll:'Coaches Poll', rank:2, team_id:194, school:'Ohio State', conference:'Big Ten', points:1741, first_votes:38},
  {season:2026, week:2, poll:'Coaches Poll', rank:9, team_id:130, school:'Michigan', conference:'Big Ten', points:900, first_votes:0},
  {season:2026, week:2, poll:'AFCA Division II Coaches Poll', rank:1, team_id:2229, school:'Ferris State', conference:'GLIAC', points:500, first_votes:20},
  {season:2026, week:2, poll:'AFCA Division III Coaches Poll', rank:3, team_id:9999, school:'Wisconsin-River Falls', conference:'WIAC', points:300, first_votes:0}
];
const RATINGS = [
  {team_id:194, school:'Ohio State', season:2026, sp_overall:-999, sp_offense:-999, sp_defense:-999, elo:-999, srs:-999, fpi:28.676},
  {team_id:130, school:'Michigan', season:2026, sp_overall:-999, sp_offense:-999, sp_defense:-999, elo:-999, srs:-999, fpi:15.875},
  {team_id:2483, school:'Wyoming', season:2026, sp_overall:-999, sp_offense:-999, sp_defense:-999, elo:-999, srs:-999, fpi:-13.069}
];
const CALENDAR = [
  {season:2026, week:1, season_type:'regular', first_game:Date.now()-9*86400000, last_game:Date.now()},
  {season:2026, week:2, season_type:'regular', first_game:Date.now(),            last_game:Date.now()+7*86400000},
  {season:2026, week:3, season_type:'regular', first_game:Date.now()+7*86400000, last_game:Date.now()+14*86400000}
];
const SCHEDULE = [
  /* week 1 is IN THE BOOKS - every row completed with a score. currentWeek() must
     skip it even though the calendar window for week 1 ends today. */
  {game_id:11, season:2026, week:1, season_type:'regular', start_date:Date.now()-8*86400000, start_time_tbd:0, completed:1, neutral_site:0, conference_game:0,
   venue:'Ohio Stadium', home_id:194, home_team:'Ohio State', home_conference:'Big Ten', home_division:'FBS', home_points:38,
   away_id:2229, away_team:'Ferris State', away_conference:'GLIAC', away_division:'D2', away_points:10, tv_outlet:'BTN'},
  {game_id:12, season:2026, week:1, season_type:'regular', start_date:Date.now()-7*86400000, start_time_tbd:0, completed:1, neutral_site:0, conference_game:0,
   venue:'Michigan Stadium', home_id:130, home_team:'Michigan', home_conference:'Big Ten', home_division:'FBS', home_points:17,
   away_id:2483, away_team:'Wyoming', away_conference:'Mountain West', away_division:'FBS', away_points:20, tv_outlet:'FOX'},
  /* week 2 - the one the app should open on */
  {game_id:21, season:2026, week:2, season_type:'regular', start_date:Date.now()+2*86400000, start_time_tbd:0, completed:0, neutral_site:0, conference_game:1,
   venue:'Ohio Stadium', home_id:194, home_team:'Ohio State', home_conference:'Big Ten', home_division:'FBS', home_points:-1,
   away_id:130, away_team:'Michigan', away_conference:'Big Ten', away_division:'FBS', away_points:-1, tv_outlet:'FOX'},
  {game_id:22, season:2026, week:2, season_type:'regular', start_date:Date.now()+3*86400000, start_time_tbd:1, completed:0, neutral_site:0, conference_game:1,
   venue:'War Memorial', home_id:2483, home_team:'Wyoming', home_conference:'Mountain West', home_division:'FBS', home_points:-1,
   away_id:2229, away_team:'Ferris State', away_conference:'GLIAC', away_division:'D2', away_points:-1, tv_outlet:'N/A'},
  {game_id:23, season:2026, week:2, season_type:'regular', start_date:Date.now()+3*86400000, start_time_tbd:0, completed:0, neutral_site:1, conference_game:0,
   venue:'Neutral Dome', home_id:130, home_team:'Michigan', home_conference:'Big Ten', home_division:'FBS', home_points:-1,
   away_id:2483, away_team:'Wyoming', away_conference:'Mountain West', away_division:'FBS', away_points:-1, tv_outlet:'ESPN'},
  /* week 3 - must exist in the picker but never be the default */
  {game_id:31, season:2026, week:3, season_type:'regular', start_date:Date.now()+9*86400000, start_time_tbd:0, completed:0, neutral_site:0, conference_game:0,
   venue:'Ohio Stadium', home_id:194, home_team:'Ohio State', home_conference:'Big Ten', home_division:'FBS', home_points:-1,
   away_id:9999, away_team:'Wisconsin-River Falls', away_conference:'WIAC', away_division:'D3', away_points:-1, tv_outlet:'BTN'}
];
/* Betting Lines carries one row PER SPORTSBOOK. Game 21 has three, so the
   dedupe has to pick DraftKings and the slate has to show exactly one line. */
const LINES = [
  {game_id:21, season:2026, week:2, provider:'consensus',  spread:-3.5, over_under:54.5, formatted:'Ohio State -3.5'},
  {game_id:21, season:2026, week:2, provider:'DraftKings', spread:-4.0, over_under:55.5, formatted:'Ohio State -4.0'},
  {game_id:21, season:2026, week:2, provider:'Bovada',     spread:-3.0, over_under:54.0, formatted:'Ohio State -3.0'},
  {game_id:23, season:2026, week:2, provider:'ESPN Bet',   spread:-14,  over_under:61.5, formatted:'Michigan -14.0'},
  {game_id:11, season:2026, week:1, provider:'DraftKings', spread:-28,  over_under:49.5, formatted:'Ohio State -28.0'}
];
/* The recap archive. Deliberately covers only ONE of the two completed week-1
   games: game 12 is played but absent, which is the real D2 / not-yet-rebuilt case
   and must render no postgame block at all rather than a shell full of dashes. */
const RESULTS = [
  {game_id:11, week:1, week_key:'2026-0-01', week_label:'Week 1', home_points:38, away_points:10,
   winner_id:194, winner_team:'Ohio State', margin:28, aftermath_index:44, index_why:'swing 91, stakes 60, scoring 40',
   excitement_index:3.1, upset:0, rivalry:0, went_ot:0, one_score:0, comeback:0,
   cover_result:'Home covered', ou_result:'Under', ml_payout:8.2, attendance:102780}
];
const RECAPS = [
  {game_id:11, headline:'BUCKEYES BURY FERRIS STATE BY FOUR SCORES', money_line:'Never in doubt after the second quarter.',
   angle:'blowout', tux_grade:'D', gen_status:'voiced'}
];

const feat = (attrs, geometry) => geometry ? { attributes:attrs, geometry } : { attributes:attrs };

(async () => {
  const browser = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell' });
  const page = await browser.newPage();
  const errors = [], console_errors = [];
  let gtwHits = 0;
  let rankPages = 0;
  page.on('pageerror', e => errors.push((e.stack||String(e)).split('\n').slice(0,9).join(' >> ')));
  page.on('console', m => { if (m.type()==='error') console_errors.push(m.text()); });

  // block tiles + logos (no network), mock every AGOL query
  await page.route('**://services.arcgisonline.com/**', r => r.abort());
  await page.route('**://a.espncdn.com/**', r => r.abort());
  await page.route('**://nominatim.openstreetmap.org/**', r =>
    r.fulfill({ contentType:'application/json', body: JSON.stringify([{lat:'40.0017', lon:'-83.0197', display_name:'Columbus, Franklin County, Ohio, USA'}]) }));

  await page.route('**://services.arcgis.com/**', async route => {
    const url = route.request().url();
    const post = route.request().postData() || '';
    const all = url + '&' + post;
    let body;
    if (/CFB_Atlas_Teams/.test(all)) {
      const m = all.match(/where=([^&]*)/);
      const where = m ? decodeURIComponent(m[1]) : '1=1';
      const idm = where.match(/team_id=(\d+)/);
      if (idm) body = { features:[ feat({ team_id:+idm[1], program_history:'A long history.', season_2025_sum:'Good year.',
        outlook_2026:'Optimistic.', mascot_story:'A nut.', fanbase_story:'Loud.', rival_program:'That team up north.',
        narrative_engine:'groq:llama-3.3-70b-versatile', narrative_researched:'2026-07-19' }) ] };
      else body = { features: TEAMS.map(t=>feat(t)) };
    } else if (/Territories\/FeatureServer\/3/.test(all)) {
      body = { features: EMPIRES.map(e=>feat(e, /returnGeometry=true/.test(all) ? { rings:[[[-84,39],[-82,39],[-82,41],[-84,41],[-84,39]]] } : null)) };
    } else if (/Territories\/FeatureServer\/2/.test(all)) {
      body = { features:[ feat(COUNTY, { rings:[[[-83.2,39.8],[-82.8,39.8],[-82.8,40.2],[-83.2,40.2],[-83.2,39.8]]] }) ] };
    } else if (/Territories\/FeatureServer\/0/.test(all)) {
      body = { count: 1 };
    } else if (/CFB_Atlas_Stats\/FeatureServer\/0/.test(all)) {
      body = { features: SCHEDULE.map(x=>feat(x)) };
    } else if (/CFB_Atlas_Stats\/FeatureServer\/1/.test(all)) {
      /* Deliberately served in two pages with the server's own more-to-come flag, so
         a regression that stops paging loses half the poll rows and fails loudly. */
      const m = all.match(/resultOffset=(\d+)/);
      const off = m ? +m[1] : 0;
      rankPages++;
      const slice = RANKINGS.slice(off, off + 6);
      body = { features: slice.map(x=>feat(x)),
               exceededTransferLimit: off + 6 < RANKINGS.length };
    } else if (/CFB_Atlas_Stats\/FeatureServer\/2/.test(all)) {
      body = { features: RATINGS.map(x=>feat(x)) };
    } else if (/CFB_Atlas_Recaps\/FeatureServer\/0/.test(all)) {
      body = { features: /resultOffset=[1-9]/.test(all) ? [] : RESULTS.map(x=>feat(x)) };
    } else if (/CFB_Atlas_Recaps\/FeatureServer\/1/.test(all)) {
      body = { features: /resultOffset=[1-9]/.test(all) ? [] : RECAPS.map(x=>feat(x)) };
    } else if (/CFB_Atlas_Stats\/FeatureServer\/3/.test(all)) {
      body = { features: LINES.map(x=>feat(x)) };
    } else if (/CFB_Atlas_Stats\/FeatureServer\/4/.test(all)) {
      body = { features: CALENDAR.map(x=>feat(x)) };
    } else if (/GamesThisWeek/.test(all)) {
      gtwHits++;                       // the slate is schedule-driven now; this must stay 0
      body = { features: [] };
    } else body = { features: [] };
    route.fulfill({ contentType:'application/json', body: JSON.stringify(body) });
  });

  await page.goto('file:///home/claude/ata/index.html');
  await page.waitForFunction(() => document.querySelector('#loadstate').textContent.includes('programs'), { timeout:15000 });
  await page.waitForTimeout(500);

  const out = {};
  out.loadstate = await page.textContent('#loadstate');

  // --- HOME
  out.home_status = await page.locator('#home-status .tile').count();
  out.home_qcards = await page.locator('#home-questions .qcard').count();
  out.home_poll   = await page.locator('#home-poll .pollrow').count();
  out.home_polllab= (await page.textContent('#poll-label')).replace(/\s+/g,' ').trim();
  out.poll_week_default = await page.inputValue('#poll-week').catch(()=>'none');
  out.poll_week_opts = await page.locator('#poll-week option').allTextContents();
  out.poll_rows = await page.locator('#home-poll .pollrow').allTextContents();
  out.poll_dupes = await page.evaluate(()=>{
    const n = [...document.querySelectorAll('#home-poll .pollrow')].map(r=>r.dataset.tid);
    return n.length - new Set(n).size;               // must be 0
  });
  out.poll_move     = await page.locator('#home-poll .mv').allTextContents();
  out.poll_dropout  = (await page.textContent('#home-poll .dropout').catch(()=>'none')).replace(/\s+/g,' ').trim();
  out.poll_filters  = await page.locator('#poll-filters select').count();
  out.poll_conf_opts= await page.locator('#pf-conf option').allTextContents();
  // conference filter narrows the board
  await page.selectOption('#pf-conf','Big Ten');
  await page.waitForTimeout(200);
  out.poll_by_conf  = await page.locator('#home-poll .pollrow').count();
  await page.selectOption('#pf-conf','');
  await page.waitForTimeout(200);
  // movement filter: Ohio State went 3 -> 1 (riser), Michigan 12 -> 7 (riser)
  await page.selectOption('#pf-move','up');
  await page.waitForTimeout(200);
  out.poll_risers   = await page.locator('#home-poll .pollrow').count();
  await page.selectOption('#pf-move','down');
  await page.waitForTimeout(200);
  out.poll_fallers  = await page.locator('#home-poll .pollrow').count();
  out.poll_empty_msg= (await page.textContent('#home-poll')).replace(/\s+/g,' ').trim().slice(0,70);
  await page.selectOption('#pf-move','');
  await page.waitForTimeout(200);
  // the first release of a poll has nothing to move against
  await page.selectOption('#poll-week','2026-1');
  await page.waitForTimeout(250);
  out.poll_wk1_move_disabled = await page.getAttribute('#pf-move','disabled') !== null;
  await page.selectOption('#poll-week','2026-2');
  await page.waitForTimeout(250);
  // the scroll pane must reserve its own gutter so the scrollbar clears the content
  out.poll_gutter = await page.evaluate(()=>{
    const n = document.querySelector('#home-poll');
    const cs = getComputedStyle(n);
    return { padRight: cs.paddingRight, gutter: cs.scrollbarGutter || 'unsupported' };
  });
  // paging back to week 1 must show the PRESEASON ranks
  await page.selectOption('#poll-week','2026-1');
  await page.waitForTimeout(250);
  out.poll_wk1_rows = await page.locator('#home-poll .pollrow').allTextContents();
  await page.selectOption('#poll-week','2026-2');
  await page.waitForTimeout(250);
  // switching poll resets to that poll's own latest release
  await page.selectOption('#poll-pick','AFCA Division II Coaches Poll');
  await page.waitForTimeout(250);
  out.poll_d2_week = await page.inputValue('#poll-week').catch(()=>'none');
  out.poll_d2_rows = await page.locator('#home-poll .pollrow').allTextContents();
  await page.selectOption('#poll-pick','AP Top 25');
  await page.waitForTimeout(250);
  out.home_pollmap= await page.locator('#map-poll .leaflet-container, #map-poll.leaflet-container').count();
  out.home_pollmarks = await page.locator('#map-poll path.leaflet-interactive').count();
  out.home_qnums = await page.locator('#home-questions .qnum').count();
  out.home_go = await page.textContent('#home-questions .qcard:first-child .go');
  out.home_polllchip = await page.locator('#home-poll .lchip').count();
  out.youarehere = await page.locator('.card.youarehere').count();
  out.home_clickhint = (await page.textContent('#home-poll, .clickhint').catch(()=>'')).includes('live link');
  await page.click('nav.modes button[data-mode="turf"]');

  // --- HOME TURF
  out.turf_county   = await page.textContent('#turf-panel .hero');
  out.turf_bg       = await page.locator('#turf-panel .pill.alert').count();
  out.turf_tiles    = await page.locator('#turf-panel .tile').count();
  out.turf_near     = await page.locator('#near-list .nearrow').count();
  out.turf_games    = await page.locator('#turf-nearby-games .nearrow').count();
  out.turf_sharebar = await page.locator('#tf-bar i').count();
  out.turf_bigbtns  = await page.locator('#m-turf .bigbtn').count();
  out.turf_maphint  = await page.locator('#turf-maphint').count();
  out.turf_saturday = (await page.textContent('#turf-nearby-games')).includes('physically reachable');
  out.turf_mappts = await page.locator('#map-turf path.leaflet-interactive').count();
  out.turf_lchips   = await page.locator('#turf-panel .lchip').count();
  out.sat_lchips    = await page.locator('#turf-nearby-games .lchip').count();

  // --- TAPE (preloaded Ohio State vs Michigan)
  await page.click('nav.modes button[data-mode="tape"]');
  out.tape_score  = await page.textContent('.verdict .score');
  out.tape_rows   = await page.locator('#duels .duel').count();
  out.tape_live   = await page.locator('#duels .duel:not(.na)').count();
  out.tape_verdict= (await page.textContent('#tape-out .card > div:nth-child(2)')) || '';
  out.tape_spark  = await page.locator('#spark svg path').count();
  out.tape_h2h    = await page.locator('#tape-out .pill.good').count();
  out.tape_presets= await page.locator('#tape-presets .chip[title]').count();
  out.tape_verdictline = await page.locator('#tape-out .verdictline').count();
  out.tape_excols = await page.locator('#m-tape .ex-cols > div').count();
  await page.click('#tape-presets .chip[data-preset-tape="USC|UCLA"]');
  out.preset_LA = await page.textContent('.verdict .score').catch(()=>'FAILED');
  await page.click('#tape-presets .chip[data-preset-tape="Notre Dame|BYU"]');
  out.preset_faith = await page.textContent('#tape-out').then(t=>t.includes('not a school name')?'graceful-miss':'loaded').catch(()=>'FAILED');
  await page.evaluate(()=>{ TAPE.a = DB.byName.get('ohio state'); TAPE.b = DB.byName.get('michigan'); renderTape(); });

  // D3 vs D2 - thin data path
  await page.click('#btn-swap');
  await page.evaluate(() => { TAPE.a = DB.byName.get('wisconsin-river falls'); TAPE.b = DB.byName.get('ferris state'); renderTape(); });
  out.thin_live = await page.locator('#duels .duel:not(.na)').count();
  out.thin_score = await page.textContent('.verdict .score');

  // --- GAUNTLET
  await page.click('nav.modes button[data-mode="gauntlet"]');
  out.g_rows   = await page.locator('#g-table tbody tr').count();
  out.g_hdr    = await page.textContent('#g-team .card div[style*="font-size:20px"]').catch(()=>'');
  out.g_index  = await page.textContent('#g-team .bignum').catch(()=>'');
  out.g_indexnote = (await page.textContent('#g-team .indexnote').catch(()=>'')).slice(0,42);
  out.g_weeks  = await page.locator('#g-team .wk').count();
  out.g_byes   = await page.locator('#g-team .wk.bye').count();
  out.g_tiles  = await page.locator('#g-team .tile').count();
  await page.selectOption('#g-sort','miles');
  out.g_by_miles = await page.textContent('#g-table tbody tr:first-child td:first-child');
  await page.selectOption('#g-div','');
  out.g_alldiv = await page.locator('#g-table tbody tr').count();
  await page.waitForTimeout(400);
  out.g_boardwide = await page.evaluate(()=>{
    const b = document.querySelector('#g-table'), m = document.querySelector('#map-gaunt');
    if(!b||!m) return 'missing';
    return 'board=' + Math.round(b.getBoundingClientRect().width) + ' map=' + Math.round(m.getBoundingClientRect().width);
  });
  out.g_logos = await page.locator('#g-table .lchip').count();
  out.g_mappts = await page.locator('#map-gaunt path.leaflet-interactive').count();
  out.g_map = await page.evaluate(()=>{
    const n = document.querySelector('#map-gaunt');
    if (!n) return 'missing';
    const r = n.getBoundingClientRect();
    const panes = n.querySelectorAll('.leaflet-map-pane').length;
    const layers = n.querySelectorAll('path.leaflet-interactive').length;
    const z = (window.GAUNT && GAUNT.map) ? GAUNT.map.getZoom() : null;
    const c = (window.GAUNT && GAUNT.map) ? GAUNT.map.getCenter() : null;
    return Math.round(r.width)+'x'+Math.round(r.height)+' panes='+panes+' vectors='+layers+
           ' zoom='+z+' center='+(c?c.lat.toFixed(2)+','+c.lng.toFixed(2):'-');
  });

  /* --- THE EXPERIENCE now lives outside the app. There is no tab, no iframe and
     no viewport-fitting routine left; the home card links straight out to the
     published short link, and nothing anywhere should still route to a mode that
     does not exist. */
  await page.click('nav.modes button[data-mode="home"]');
  await page.waitForTimeout(250);
  out.exb_tab      = await page.locator('nav.modes button[data-mode="experience"]').count();   // 0
  out.exb_section  = await page.locator('#m-experience').count();                              // 0
  out.exb_iframe   = await page.locator('iframe').count();                                     // 0
  out.exb_href     = await page.getAttribute('#home-exb','href');
  out.exb_target   = await page.getAttribute('#home-exb','target');
  out.exb_goto     = await page.locator('[data-goto="experience"]').count();                   // 0
  out.exb_about_link = await page.getAttribute('#m-about a[href*="bit.ly"]','href').catch(()=>'none');
  /* A stale #experience bookmark must land on home rather than on a page with
     every section hidden. This has to be a COLD LOAD - the guard runs in boot(),
     so setting the hash on an already-open page proves nothing. */
  /* about:blank first - a goto that differs only by fragment is a same-document
     navigation, so the page would never reload and boot() would never re-run */
  await page.goto('about:blank');
  await page.goto('file:///home/claude/ata/index.html#experience');
  await page.waitForFunction(() => document.querySelector('#loadstate').textContent.includes('programs'), { timeout:15000 });
  await page.waitForTimeout(400);
  await page.waitForTimeout(1200);
  out.exb_stale_hash = await page.evaluate(()=>({
    sectionsOn: [...document.querySelectorAll('section.mode.on')].map(s=>s.id),
    hash: location.hash,
    homeTab: document.querySelector('nav.modes button[data-mode="home"]').getAttribute('aria-selected')
  }));
  await page.goto('about:blank');
  await page.goto('file:///home/claude/ata/index.html');
  await page.waitForFunction(() => document.querySelector('#loadstate').textContent.includes('programs'), { timeout:15000 });
  await page.waitForTimeout(400);
  out.youarehere_border = await page.evaluate(()=>{
    const c = document.querySelector('.card.youarehere'); if(!c) return 'missing';
    return getComputedStyle(c).borderTopColor;
  });
  out.badge_bg = await page.evaluate(()=>{
    const b = document.querySelector('.badge.cus'); return b ? getComputedStyle(b).backgroundColor : 'missing';
  });
  out.qnum_color = await page.evaluate(()=>{
    const b = document.querySelector('#home-questions .qnum'); return b ? getComputedStyle(b).color : 'missing';
  });
  out.base_font = await page.evaluate(()=> getComputedStyle(document.body).fontSize);
  out.foot_links = await page.locator('footer.foot a[data-goto]').count();

  // --- SCREENER
  await page.click('nav.modes button[data-mode="screener"]');
  out.footer_back = await page.evaluate(()=> getComputedStyle(document.querySelector('footer.foot')).display);
  out.scr_rows = await page.locator('#scr-table tbody tr').count();
  out.scr_fbs_default = await page.getAttribute('#scr-divs .chip[data-div="FBS"]', 'aria-pressed');
  out.scr_presets = await page.locator('#scr-presets .chip.preset').count();
  out.scr_preset_tips = await page.locator('#scr-presets .chip.preset[title]').count();
  out.scr_col_tips = await page.locator('#scr-table th[title]').count();
  out.scr_no_csv = await page.locator('#scr-csv').count();
  out.scr_logos = await page.locator('#scr-table tbody .lchip').count();
  out.conf_opts_all = await page.locator('#scr-conf option').count();
  await page.selectOption('#scr-state','OH');
  await page.waitForTimeout(120);
  out.conf_opts_OH = await page.locator('#scr-conf option').count();
  await page.selectOption('#scr-state','');
  await page.click('th[data-col="capacity"]');
  out.scr_first_by_cap = await page.textContent('#scr-table tbody tr:first-child td:first-child');
  await page.click('#scr-presets .chip.preset[data-preset="thinair"]');
  out.scr_thinair = await page.locator('#scr-table tbody tr').count();
  out.scr_thinair_who = await page.textContent('#scr-table tbody tr:first-child td:first-child').catch(()=>'');
  await page.click('#scr-presets .chip.preset[data-preset="thinair"]');
  await page.click('#scr-reset');
  out.scr_after_reset = await page.locator('#scr-table tbody tr').count();

  // drawer
  await page.click('#scr-table tbody tr:first-child');
  await page.waitForTimeout(300);
  out.drawer_open = await page.locator('#drawer.on').count();
  out.drawer_narr = (await page.textContent('#d-narr')).slice(0,60);
  out.drawer_sched= await page.locator('#drawer table.mini').count();
  await page.click('#dclose');

  // --- SLATE
  await page.click('nav.modes button[data-mode="slate"]');
  out.slate_cards = await page.locator('#slate-grid .game').count();
  out.slate_scores = await page.locator('#slate-grid .watch .sc').allTextContents();
  out.slate_lchips = await page.locator('#slate-grid .lchip').count();
  out.slate_time   = (await page.textContent('#slate-grid .game:first-child .gmeta')).slice(0,54);
  out.slate_layout = await page.evaluate(()=>{
    const b = document.querySelector('.slate-brief');
    const ex = document.querySelector('.slate-brief .explainer');
    const mp = document.querySelector('#map-slate');
    if(!b||!ex||!mp) return 'missing';
    const bw = b.getBoundingClientRect().width;
    const ew = ex.getBoundingClientRect().width, mw = mp.getBoundingClientRect().width;
    return { split: Math.round(ew/bw*100)+'/'+Math.round(mw/bw*100),
             sameRow: Math.abs(ex.getBoundingClientRect().top - mp.getBoundingClientRect().top) < 40,
             explainerH: Math.round(ex.getBoundingClientRect().height),
             mapH: Math.round(mp.getBoundingClientRect().height),
             wordsKept: ex.innerText.replace(/\s+/g,' ').trim().length };
  });
  // zooming the map must not move anything around it
  out.slate_zoom_stable = await page.evaluate(async ()=>{
    const grid = document.querySelector('#slate-grid');
    const before = Math.round(grid.getBoundingClientRect().top);
    document.querySelector('#map-slate .leaflet-control-zoom-in').click();
    await new Promise(r=>setTimeout(r,600));
    const after = Math.round(grid.getBoundingClientRect().top);
    return before===after ? 'stable' : 'MOVED '+before+' -> '+after;
  });
  out.slate_home_btn = await page.locator('#map-slate .atlas-home a').count();
  out.slate_dots   = await page.evaluate(()=>{
    const rs = [...document.querySelectorAll('#map-slate path.leaflet-interactive')].map(p=>p.getAttribute('d')||'');
    return new Set(rs.map(d=>(d.match(/a([\d.]+),/)||[])[1])).size + ' distinct radii / ' + rs.length + ' dots';
  });
  await page.locator('#m-slate .filters').screenshot({ path:'/home/claude/ata/shot-slate-filters.png' });
  out.slate_divs      = await page.locator('#sl-divs .chip').allTextContents();
  out.slate_div_default = await page.evaluate(()=>
    [...document.querySelectorAll('#sl-divs .chip')].filter(b=>b.getAttribute('aria-pressed')==='true').map(b=>b.textContent));
  out.slate_conf_opts = await page.locator('#sl-conf option').allTextContents();
  out.slate_no_match  = await page.locator('#sl-match').count();       // the old filter is gone
  /* Both sides on top of FBS alone must drop game 22 - Wyoming hosts D2 Ferris
     State, so not every participant is FBS. This is the old "FBS vs FBS" option. */
  await page.click('#sl-both');
  await page.waitForTimeout(200);
  out.slate_both_fbs  = await page.locator('#slate-grid .game').count();     // 2, not 3
  out.slate_count_lbl = (await page.textContent('#sl-count')).replace(/\s+/g,' ').trim();
  out.slate_week_opts_lens = await page.locator('#sl-week option').allTextContents();
  await page.click('#sl-both');
  await page.waitForTimeout(150);
  // D2 alone: only the game with a D2 participant survives
  await page.click('#sl-divs .chip[data-div="FBS"]');
  await page.click('#sl-divs .chip[data-div="D2"]');
  await page.waitForTimeout(200);
  out.slate_d2_only   = await page.locator('#slate-grid .game').count();     // 1
  // deselecting every division means no lens at all - same rule The Screener uses
  await page.click('#sl-divs .chip[data-div="D2"]');
  await page.waitForTimeout(200);
  out.slate_no_div    = await page.locator('#slate-grid .game').count();     // 3, unfiltered
  await page.click('#sl-divs .chip[data-div="FBS"]');
  await page.waitForTimeout(200);
  // conference lens
  await page.selectOption('#sl-conf','Big Ten');
  await page.waitForTimeout(200);
  out.slate_by_conf   = await page.locator('#slate-grid .game').count();
  out.slate_conf_lbl  = (await page.textContent('#sl-count')).replace(/\s+/g,' ').trim();
  await page.selectOption('#sl-conf','');
  await page.waitForTimeout(200);
  out.slate_week_default = await page.inputValue('#sl-week');
  out.slate_week_opts = await page.locator('#sl-week option').allTextContents();
  out.slate_day_opts  = await page.locator('#sl-day option').allTextContents();
  out.slate_count     = (await page.textContent('#sl-count')).replace(/\s+/g,' ').trim();
  out.slate_one_line  = await page.evaluate(()=>{
    const c = document.querySelector('#slate-grid .game[data-gid="21"]');
    return c ? (c.textContent.match(/Ohio State -/g)||[]).length + ' line(s): ' +
      ((c.textContent.match(/Ohio State -[\d.]+/)||['none'])[0]) : 'missing';
  });
  // week 1 is finished - picking it must show FINAL and the scores
  await page.selectOption('#sl-week','1');
  await page.waitForTimeout(200);
  out.wk1_cards  = await page.locator('#slate-grid .game').count();
  out.wk1_final  = await page.locator('#slate-grid .gfinal').count();
  out.wk1_scores = await page.locator('#slate-grid .gsc').allTextContents();
  out.wk1_winner = await page.locator('#slate-grid .gsc.w').allTextContents();
  out.wk1_days   = await page.locator('#sl-day option').allTextContents();
  // ---- the postgame block, joined from the Recaps service ----
  out.tux_blocks   = await page.locator('#slate-grid .tux').count();          // 1 of 2 - game 12 is not archived
  out.tux_grade    = await page.textContent('#slate-grid .tgrade').catch(()=>'none');
  out.tux_outcome  = await page.textContent('#slate-grid .tres').catch(()=>'none');
  out.tux_headline = await page.textContent('#slate-grid .thead').catch(()=>'none');
  out.tux_delivered= await page.textContent('#slate-grid .tidx').catch(()=>'none');
  out.tux_link     = await page.getAttribute('#slate-grid a.tbtn','href').catch(()=>'none');
  out.tux_flag     = await page.locator('#slate-grid .tflag').allTextContents();
  out.tux_gradecls = await page.getAttribute('#slate-grid .tgrade','class').catch(()=>'none');
  // live records replace last season's on the card
  out.card_records = await page.locator('#slate-grid .gteam .m').allTextContents();
  // the map popup
  await page.locator('#map-slate path.leaflet-interactive').first().click();
  await page.waitForTimeout(300);
  out.popup = (await page.textContent('.leaflet-popup-content').catch(()=>'none')).replace(/\s+/g,' ').trim();
  out.popup_rows = await page.locator('.leaflet-popup-content .pop .prow').count();
  out.popup_link = await page.getAttribute('.leaflet-popup-content a.tbtn','href').catch(()=>'none');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(150);
  // the OTHER marker is the archived game - its popup must carry the grade and the link
  await page.locator('#map-slate path.leaflet-interactive').nth(1).click();
  await page.waitForTimeout(300);
  out.popup2 = (await page.textContent('.leaflet-popup-content').catch(()=>'none')).replace(/\s+/g,' ').trim();
  out.popup2_link = await page.getAttribute('.leaflet-popup-content a.tbtn','href').catch(()=>'none');
  out.popup2_grade = await page.locator('.leaflet-popup-content .tgrade').count();
  await page.keyboard.press('Escape');
  await page.waitForTimeout(150);
  await page.locator('#slate-grid').screenshot({ path:'/home/claude/ata/shot-slate-wk1.png' });
  // day cascade inside a week
  await page.selectOption('#sl-week','2');
  await page.waitForTimeout(200);
  const d2 = await page.locator('#sl-day option').nth(1).getAttribute('value');
  await page.selectOption('#sl-day', d2);
  await page.waitForTimeout(150);
  out.day_filtered = d2 + ' -> ' + (await page.locator('#slate-grid .game').count()) + ' cards';
  // switching week must drop a day that does not exist in the new week
  await page.selectOption('#sl-week','3');
  await page.waitForTimeout(200);
  out.day_reset_on_week_change = await page.inputValue('#sl-day');
  out.wk3_cards = await page.locator('#slate-grid .game').count();
  await page.selectOption('#sl-week','');
  await page.waitForTimeout(200);
  out.season_cards = await page.locator('#slate-grid .game').count();
  await page.selectOption('#sl-week','2');
  await page.waitForTimeout(200);
  out.rank_pills = await page.locator('#slate-grid .rankpill').allTextContents();
  out.slate_top = await page.textContent('#slate-grid .game:first-child .gteam.h .s');
  out.slate_why = await page.textContent('#slate-grid .game:first-child .why');
  await page.selectOption('#sl-sort','trip');
  out.slate_by_trip = await page.textContent('#slate-grid .game:first-child .why');
  await page.click('#sl-line');
  out.slate_lineonly = await page.locator('#slate-grid .game').count();
  await page.click('#sl-line');
  await page.click('#sl-rival');
  out.slate_rivalonly = await page.locator('#slate-grid .game').count();
  await page.click('#sl-rival');

  // --- ABOUT
  await page.click('nav.modes button[data-mode="about"]');
  out.about_tiles = await page.locator('#honesty .tile').count();
  out.about_svcs  = await page.locator('#svc-list .svcrow').count();
  out.about_meth  = await page.locator('table.meth').count();
  out.watch_key   = await page.locator('#watch-key .keyitem').count();
  out.svc_endpoints = await page.locator('#svc-list .endpoint a').count();
  out.svc_items   = await page.locator('#svc-list .svc-a a').count();
  out.author      = await page.locator('.authorrow .headshot').count();
  out.tglogo      = await page.locator('.authorrow .tglogo').count();
  out.about_pairs = await page.locator('#m-about .split').count();
  out.svc_groups  = await page.locator('#svc-list .svcgroup').count();
  out.svc_pjson   = await page.locator('#svc-list a[href*="f=pjson"]').count();
  out.svc_label   = await page.textContent('#svc-list .svc-a a');
  out.li          = await page.getAttribute('.authorbody .al a', 'href');
  out.nav_q       = await page.locator('nav.modes button em').count();
  out.foot_stamp  = (await page.textContent('#foot-stamp')).replace(/\s+/g,' ').trim();

  out.tux_sibling_card = await page.locator('.split.three > .card').count();
  // ---- the dossier shows the season with results ----
  await page.click('nav.modes button[data-mode="home"]');
  await page.waitForTimeout(250);
  await page.click('#home-poll .pollrow');
  await page.waitForTimeout(400);
  out.dossier_open    = await page.locator('#drawer.on').count();
  out.dossier_head    = await page.textContent('#drawer-body h4');
  out.dossier_wl      = await page.locator('#drawer-body .wl').allTextContents();
  out.dossier_res     = await page.locator('#drawer-body td.res').allTextContents();
  out.dossier_tuxlink = await page.getAttribute('#drawer-body a.tuxlink','href').catch(()=>'none');
  out.dossier_tiles   = await page.locator('#drawer-body .tiles .tile').allTextContents();
  await page.locator('#drawer').screenshot({ path:'/home/claude/ata/shot-dossier.png' });
  await page.click('#dclose');
  await page.waitForTimeout(200);

  out.rankings_pages = rankPages;      // must be > 1: the offset loop ran
  out.rankings_loaded = await page.evaluate(()=> DB.rankings.length);
  out.gamesThisWeek_reads = gtwHits;   // must be 0
  /* ---------------------------------------------------------------------
     NO BRITISH SPELLING. BK asked for American throughout.

     This scans the SOURCE TEMPLATE, not the rendered page, and that is a
     deliberate choice rather than a shortcut:

       - The source is the only place authored prose lives. Scanning it catches
         code comments and tooltip strings that never render until someone hovers
         the right element, which is precisely where "normalised" and "LABELLED"
         survived the last three reviews.
       - The rendered page is full of DATA, and the data is not ours to police.
         "Centre College Kentucky" is a real D3 program in the Teams layer, and
         four schools play as the Greyhounds. A guard that reads document.textContent
         fails on those the moment a screener filter or a typeahead happens to show
         one - and a guard that cries wolf gets deleted.

     Keep each entry a whole word. Do not add "flat" (a CSS class and a normal
     English adjective) or "sport" (used correctly in the singular here). */
  const BRITISH = [
    'colour','colours','coloured','colourful','behaviour','behaviours','favour','favours',
    'favourite','favourites','favoured','honour','honours','labour','neighbour','neighbours',
    'rumour','harbour','flavour','humour','endeavour','armour','parlour','saviour','vigour',
    'normalise','normalises','normalised','normalising','normalisation',
    'organise','organises','organised','organising','organisation',
    'recognise','recognises','recognised','recognising',
    'realise','realises','realised','realising',
    'analyse','analyses','analysed','analysing','paralyse','catalyse',
    'summarise','summarised','prioritise','prioritised','utilise','utilised',
    'minimise','minimised','maximise','maximised','optimise','optimised',
    'customise','customised','standardise','standardised','initialise','initialised',
    'serialise','serialised','visualise','visualised','categorise','categorised',
    'characterise','characterised','emphasise','emphasised','specialise','specialised',
    'generalise','generalised','authorise','authorised','centralise','centralised',
    'capitalise','capitalised','finalise','finalised','localise','localised',
    'rationalise','rationalised','randomise','randomised','itemise','itemised',
    'apologise','apologised','criticise','criticised','sanitise','sanitised',
    'synchronise','synchronised','stabilise','stabilised','penalise','penalised',
    'centre','centres','centred','centring','metre','metres','litre','litres',
    'theatre','theatres','fibre','fibres','calibre','sombre','spectre','lustre','manoeuvre',
    'defence','offence','pretence','licence','practise','practised','practising',
    'labelled','labelling','modelled','modelling','travelled','travelling','traveller',
    'cancelled','cancelling','signalled','signalling','totalled','totalling',
    'fuelled','fuelling','levelled','levelling','channelled','funnelled','equalled',
    'counsellor','counselled','jewellery','woollen','programme','programmes',
    'enrol','enrolment','fulfil','fulfilment','instalment','skilful','wilful',
    'catalogue','catalogues','dialogue','dialogues','analogue','monologue',
    'grey','greyed','greying','aluminium','aeroplane','draught','kerb','plough',
    'sceptical','scepticism','storey','storeys','tyre','tyres','cheque','cheques',
    'mould','moustache','pyjamas','sulphur','artefact','artefacts','ageing',
    'encyclopaedia','mediaeval','foetus','orientated','acclimatise',
    'learnt','spelt','burnt','dreamt','leapt','spoilt','smelt','knelt',
    'towards','amongst','whilst','anticlockwise','maths','forwards','backwards',
    'upwards','downwards','afterwards','fortnight','lorry','postcode','rubbish',
    'per cent','car park','in hospital','at university'
  ];
  const britRe = new RegExp('\\b(' + BRITISH.join('|') + ')\\b', 'ig');
  const britSrc = fs.readFileSync(path.resolve(__dirname, 'src', 'app.template.html'), 'utf8');
  const britHits = [];
  britSrc.split('\n').forEach((line, i) => {
    if (line.includes('base64,') && line.length > 400) return;   // image payloads
    let m;
    britRe.lastIndex = 0;
    while ((m = britRe.exec(line)) !== null){
      britHits.push('line ' + (i+1) + ': ' + m[0] + '  ->  ' + line.trim().slice(0, 70));
    }
  });
  out.british_spelling = britHits.length ? britHits.slice(0, 12) : 'clean';

  out.pageerrors = errors;
  out.console_errors = console_errors.filter(t => !/net::ERR|Failed to load resource/.test(t));

  await page.screenshot({ path:'/home/claude/ata/shot-about.png', fullPage:false });
  await page.click('nav.modes button[data-mode="home"]'); await page.waitForTimeout(300);
  await page.screenshot({ path:'/home/claude/ata/shot-home.png' });
  await page.click('nav.modes button[data-mode="gauntlet"]'); await page.waitForTimeout(400);
  await page.screenshot({ path:'/home/claude/ata/shot-gauntlet.png' });
  await page.click('nav.modes button[data-mode="turf"]'); await page.waitForTimeout(400);
  await page.screenshot({ path:'/home/claude/ata/shot-turf.png' });
  await page.click('nav.modes button[data-mode="tape"]');
  await page.evaluate(() => { TAPE.a = DB.byName.get('ohio state'); TAPE.b = DB.byName.get('michigan'); renderTape(); });
  await page.waitForTimeout(400);
  await page.screenshot({ path:'/home/claude/ata/shot-tape.png' });
  await page.setViewportSize({ width:1600, height:900 });
  await page.click('nav.modes button[data-mode="slate"]'); await page.waitForTimeout(500);
  await page.screenshot({ path:'/home/claude/ata/shot-slate.png' });
  await page.setViewportSize({ width:1280, height:720 });
  await page.click('nav.modes button[data-mode="screener"]'); await page.waitForTimeout(300);
  await page.screenshot({ path:'/home/claude/ata/shot-screener.png' });
  await page.click('nav.modes button[data-mode="about"]'); await page.waitForTimeout(300);
  await page.screenshot({ path:'/home/claude/ata/shot-about2.png' });

  // home controls present on every map
  out.homeButtons = await page.evaluate(async ()=>{
    const res = {};
    for (const [mode, sel] of [['turf','#map-turf'],['home','#map-poll'],['slate','#map-slate'],
                               ['tape','#map-tape'],['gauntlet','#map-gaunt']]){
      const n = document.querySelector(sel);
      res[mode] = n ? n.querySelectorAll('.atlas-home a').length : 'no map';
    }
    return res;
  });

  // phone pass - EVERY page, not just two
  await page.setViewportSize({ width:390, height:844 });
  out.phone = {};
  for (const m of ['home','turf','tape','gauntlet','screener','slate','about']){
    await page.click('nav.modes button[data-mode="'+m+'"]');
    await page.waitForTimeout(450);
    out.phone[m] = await page.evaluate(()=>{
      const W = document.documentElement.clientWidth;
      const over = document.documentElement.scrollWidth - W;
      const scrolls = n => {
        for (let p = n.parentElement; p && p !== document.body; p = p.parentElement){
          const o = getComputedStyle(p).overflowX;
          if (o === 'auto' || o === 'scroll' || o === 'hidden') return true;
        }
        return false;
      };
      const bad = [];
      document.querySelectorAll('section.mode.on *').forEach(n=>{
        if (n.closest('.leaflet-pane')) return;   // basemap tiles legitimately extend past
        if (scrolls(n)) return;                   // inside a scroll container - contained, fine
        const r = n.getBoundingClientRect();
        if (r.right > W + 2) bad.push((n.tagName+'.'+String(n.className||'').split(' ').slice(0,2).join('.')).slice(0,46)+' r='+Math.round(r.right));
      });
      return { overflowPx: over, offenders: bad.slice(0,5) };
    });
  }
  await page.click('nav.modes button[data-mode="home"]'); await page.waitForTimeout(400);
  await page.screenshot({ path:'/home/claude/ata/shot-m-home.png' });
  await page.click('nav.modes button[data-mode="gauntlet"]'); await page.waitForTimeout(500);
  await page.screenshot({ path:'/home/claude/ata/shot-m-gauntlet.png' });
  console.log(JSON.stringify(out, null, 1));
  await browser.close();
})();
