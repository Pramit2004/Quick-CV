import React, { useEffect } from 'react'
import { Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import Layout from './pages/Layout'
import Dashboard from './pages/Dashboard'
import ResumeBuilder from './pages/ResumeBuilder'
import Preview from './pages/Preview'
import Login from './pages/Login'
import { useDispatch } from 'react-redux'
import api from './configs/api'
import { login, setLoading, logout } from './app/features/authSlice'
import { Toaster } from 'react-hot-toast'
import toast from 'react-hot-toast'
import JDMatch from './pages/JDMatch'
import Profile from './pages/Profile'
import Settings from './pages/Settings'

// Admin imports
import AdminLogin          from './pages/admin/AdminLogin'
import AdminLayout         from './pages/admin/AdminLayout'
import AdminDashboard      from './pages/admin/AdminDashboard'
import AdminAnalytics      from './pages/admin/AdminAnalytics'
import AdminUsers          from './pages/admin/AdminUsers'
import ProtectedAdminRoute from './components/admin/ProtectedAdminRoute'
import TemplateGallery     from './pages/TemplateGallery'
import AdminTemplates      from './pages/admin/AdminTemplates'
import AdminResumes        from './pages/admin/AdminResumes'
import AdminFeedback       from './pages/admin/AdminFeedback'
import AdminTemplateBuilder from './pages/admin/AdminTemplateBuilder'
import AdminJDMatch        from './pages/admin/Adminjdmatch'

// ── Module 5 ──────────────────────────────────────────────────
import TemplateStudio from './pages/TemplateStudio'
import ATSChecker    from './pages/ATSChecker'
import AdminATS      from './pages/admin/AdminATS'

const App = () => {
  const dispatch = useDispatch()

  const getUserData = async () => {
    const token = localStorage.getItem('token')
    try {
      if (token) {
        const { data } = await api.get('/api/users/data', {
          headers: { Authorization: token },
        })
        if (data.user) {
          dispatch(login({ token, user: data.user }))
        }
        dispatch(setLoading(false))
      } else {
        dispatch(setLoading(false))
      }
    } catch (error) {
      dispatch(setLoading(false))

      if (error?.response?.status === 403) {
        dispatch(logout())
        localStorage.removeItem('token')
        toast.error(
          error?.response?.data?.message ||
          'Your account has been suspended. Please contact support.'
        )
      } else if (error?.response?.status === 401) {
        dispatch(logout())
        localStorage.removeItem('token')
      }

      console.log(error.message)
    }
  }

  useEffect(() => { getUserData() }, [])

  return (
    <>
      <Toaster />
      <Routes>

        {/* ── Public user routes ──────────────────────────────── */}
        <Route path="/"      element={<Home />}  />
        <Route path="/login" element={<Login />} />

        {/* ── Protected user routes ───────────────────────────── */}
        <Route path="app" element={<Layout />}>
          <Route index                                   element={<Dashboard />}      />
          <Route path="builder/:resumeId"                element={<ResumeBuilder />}  />
          <Route path="jd-match"                         element={<JDMatch />}        />
          <Route path="profile"                          element={<Profile />}        />
          <Route path="settings"                         element={<Settings />}       />
          <Route path="templates"                        element={<TemplateGallery />}/>
          {/* Module 5 — Template Studio */}
          <Route path="template-studio/:resumeId"        element={<TemplateStudio />} />
          <Route path="ats-checker"                      element={<ATSChecker />} />
        </Route>

        {/* ── Resume preview ──────────────────────────────────── */}
        <Route path="view/:resumeId" element={<Preview />} />

        {/* ── Admin login (public) ────────────────────────────── */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* ── Admin protected routes ──────────────────────────── */}
        <Route
          path="/admin"
          element={
            <ProtectedAdminRoute>
              <AdminLayout />
            </ProtectedAdminRoute>
          }
        >
          <Route path="dashboard"          element={<AdminDashboard />}      />
          <Route path="analytics"          element={<AdminAnalytics />}      />
          <Route path="users"              element={<AdminUsers />}          />
          <Route path="resumes"            element={<AdminResumes />}        />
          <Route path="jd-match"           element={<AdminJDMatch />}        />
          <Route path="feedback"           element={<AdminFeedback />}       />
          <Route path="templates"          element={<AdminTemplates />}      />
          <Route path="templates/new"      element={<AdminTemplateBuilder />}/>
          <Route path="templates/:id/edit" element={<AdminTemplateBuilder />}/>
          <Route path="ats"               element={<AdminATS />} />
        </Route>

      </Routes>
    </>
  )
}

export default App

/*
PROBLEMS

i got this error when click to Analyze Resume

from both -> Quick CV resume and upload a resume cards
__ATSChecker.jsx:157__ Uncaught TypeError: Cannot read properties of undefined (reading 'toFixed')     at ScoreBar (__ATSChecker.jsx:157:16__)
ScoreBar@__ATSChecker.jsx:157__<ScoreBar>ATSChecker@__ATSChecker.jsx:697__<ATSChecker>App@__App.jsx:94__<App>(anonymous)@__main.jsx:11__
__ATSChecker.jsx:697__ An error occurred in the <ScoreBar> component.  Consider adding an error boundary to your tree to customize error handling behavior. Visit __https://react.dev/link/error-boundaries__ to learn more about error boundaries.
<ScoreBar>ATSChecker@__ATSChecker.jsx:697__<ATSChecker>App@__App.jsx:94__<App>(anonymous)@__main.jsx:11__

can you fix that.
*/

/* 
PROBLEMS
ok right now there is a lot's of problem there



problem -1 the big one



when i upload my resume and sent it to analysis it then show me the results but there is one of the biggest problem



you can see this console message there

__react-dom_client.js?v=b0e28492:2391__ Received NaN for the `children` attribute. If this is expected, cast the value to a string.



for my very basic and garbage resume content it show me this result

Detailed Sub-Scores

A — Structure

A1: Format & Layout

5.0 / 5

A2: Section Organization

1.0 / 5

A3: Length

5.0 / 5

A4: Visual Hierarchy

3.0 / 5

A5: Whitespace

0.0 / 5

B — Content

B1: Contact

3.0 / 3

B2: Experience

0.0 / 7

B3: Education

0.0 / 5

B4: Skills

0.0 / 5

B5: Achievements

0.0 / 7

B6: Projects

0.0 / 4

B7: Certifications

0.0 / 4

C — Writing Quality

C1: Grammar

4.0 / 4

C2: Action Verbs

0.0 / 4

C3: Metrics

0.0 / 4

C4: Readability

2.0 / 4

C5: Conciseness

4.0 / 4

D — ATS Compatibility

D1: Keywords

3.0 / 6

D2: Parsing

5.0 / 5

D3: Format Safety

5.0 / 5

D4: File Format

3.0 / 4

E — Advanced (Bonus)

E1: Career Narrative

1.0 / 2

E2: Personal Brand

1.3 / 2

E3: Industry Align

0.5 / 2

E4: Skill Recency

0.0 / 2

E5: Cultural Fit

0.0 / 2



which i am not happy it see that and it clearly indicate that resume parsing is not correctly happening there and i am sure about that



on writing section for any resumes content  it show me 

Action Verbs

0% strong verbs

Quantifiable Achievements

0

Bullets with numbers

0% of all bullets

Readability Scores

Content Clarity

No buzzwords detected



and it seems like there is an critical bug there we need to fix that  as well





in Keyword section it show me this

🎯

Detected Domain: design

13% confidence · Keyword analysis calibrated for this field

15%

keyword coverage

Matched Keywords8

uxdata-drivenuicomponent libraryprototypinguser researchuser experienceuser interface

Missing Keywords13

figmasketchadobe xdphotoshopillustratorinvisionwireframingusability testingdesign systemaccessibilitywcagresponsive designmobile-first

Top Keywords by Importance (TF-IDF)

userdrivencriticalonboardingflowssignificantlyboostingnewactivationratesdataimprovementsdesignspearheadediterationbuiltaccessiblereactcomponentlibrary



which seems ok ok but not that good that i was thinking 



so we need to improve that as well



under ATS section it show me

ATS System Compatibility

🏢

Workday

45%

✓

🔷

Taleo

40%

✓

🌱

Greenhouse

52%

✓

⚡

Lever

41%

✓

Simulated based on each ATS platform's known parsing behavior and keyword weighting patterns.



which is ok ok but not that good and correct that i was thinking about it not correct that i think 



see some were for garbage resume it show me very high percentage and for one of the best resume whih has 93 ATS score on resumeworded when i upload in my ATS checker it show me very poor results ther and show a very low score 



and some of the gravyard of garbage resumes it show me a very very good results



critical fix section it show me this result

6

Critical Fixes

2

High Impact

2

Optimization

🚨 Critical — Fix Immediately

🚨

Critical+15 pts potential

Missing critical sections: Work Experience, Education, Skills

Missing critical sections: Work Experience, Education, Skills

🚨

Critical+10 pts potential

Work Experience section is missing — this is critical for ATS scoring

Work Experience section is missing — this is critical for ATS scoring

🚨

Critical+8 pts potential

Only 0 bullet point(s) contain measurable results. Add numbers, percentages, and metrics to at least 30% of bullets

Only 0 bullet point(s) contain measurable results. Add numbers, percentages, and metrics to at least 30% of bullets

🚨

Critical+8 pts potential

Only 0 bullet point(s) contain measurable achievements. Add specific numbers, percentages, dollar amounts, or team sizes

🚨

Critical+8 pts potential

Low keyword density — only 8 industry keywords found. Add these missing critical keywords: figma, sketch, adobe xd, photoshop, illustrator

🚨

Critical+6 pts potential

Add more skills — currently 1 listed. Aim for 10–15 relevant skills

📈 High Impact — Do This Next

📈

High Impact+4 pts potential

Education section needs more detail — include degree, institution, graduation date, and field of study

Education section needs more detail — include degree, institution, graduation date, and field of study

📈

High Impact+4 pts potential

Remove 1 buzzword(s): "results-driven" — these are overused and hurt your credibility

Remove 1 buzzword(s): "results-driven" — these are overused and hurt your credibility

Found: results-driven

⚡ Optimization Tips

⚡

Optimization+3 pts potential

Adding relevant certifications can significantly boost your resume credibility

Adding relevant certifications can significantly boost your resume credibility

⚡

Optimization+3 pts potential

Add in-demand skills like cloud technologies, AI/ML tools, or modern frameworks relevant to your field

Add in-demand skills like cloud technologies, AI/ML tools, or modern frameworks relevant to your field



which is also ok ok  and not that good again that my vision



the main concern is that it doesent show me ATS SCRORE insted it show me NAN 

also under Category Breakdown -> it show nothing 



also undere Section Scores

Structure (A)

0.0 / 25

Content (B)

0.0 / 35

Writing (C)

0.0 / 20

ATS (D)

0.0 / 20

Advanced (E)

0.0 / 10

it show result like this 





this is all the results is based on my this resume -> look at this pdf 

i was upload a very very dump and garbage resume and all the result and content i was shown is based on this garbage resume



so clear indication is document parsing is not properly work because there is no any skills mention in resume then still it shoe me in my keyword section there



problem -2 



also it doesent show me an history there -> it shown empty even after analysis



also

problem -3



the design is not completely match to our them for both user side and admin side 

take inspiration form Dashboard or JD match page 



also design is not responsive for mobile so also take inspiration from other pages



also i am not like current design overall it not feel good so change it entierely



problem -4 

i want a complete new section  that show me a parsed content -> what ever content is begin parsed from pdf of document is must be shown to me in page so that i can varify that ya it works like that



problem-5

i need a improve with AI option there when i can improve my ATS score using AI enhancement 

also instruct AI to not to include false information , just improvde content what ever present there 



also we have already implement AI enhancement in our resumebuilder page so take inspiration from there



problem - 6

on admin side when i go and check there it show me an overall results there 

like for a user pramit it show overall result

so the admin never know what's each resume's of user analysis, what's problem in user's perticuler resume 



admin able to overall everything 

but but

for a perticuler user it also able to show a entire overview of perticuler user by clicking on it in ATS checker



that's it shown what's resume is it, what's data, what's missing, improvement suggestion, and every single things's must be there 



also store parsing data in DB so that both at user side and admin side we can show a data of resume 



also i don't like design at admin side as well match it with our them and ya also made it mobile responsive as well



UserReportsAvg ScoreBest ScoreLast Analysis

Pramit

onlytrue010@gmail.com

1474.4/10088/1003/11/2026





PROBLEM-7



for any garbage resume it show a high result of ats SCRORE and for a winner resumes it show me an low score 



so there is completely missing or misbehaved functionality there



problem-8

made entire design responsive as well 





-> THERE IS SOMETHING THAT NOT WORK PROPERLY AND THAT'S WHY IT BEHAVE COMPLETELY WRONG SOME TIME 



my vision is to build world smartest resume checker and you told me that you can do that

now it's you tern to showcase your power



you me your insain power and make it world best ATS CHECKER and make sure that everyhting work perfectly.





what you think.
*/