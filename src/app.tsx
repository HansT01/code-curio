// @refresh reload
import { Router } from '@solidjs/router'
import { FileRoutes } from '@solidjs/start'
import { Suspense } from 'solid-js'
import './app.css'
import Footer from './components/layouts/footer'
import Navigation from './components/layouts/sidebar-navigation'

export default function App() {
  return (
    <Router
      root={(props) => (
        <Navigation>
          <div class='flex h-full flex-col'>
            <div class='grow'>
              <Suspense>{props.children}</Suspense>
            </div>
            <Footer />
          </div>
        </Navigation>
      )}
    >
      <FileRoutes />
    </Router>
  )
}
