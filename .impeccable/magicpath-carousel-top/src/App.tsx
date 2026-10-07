import { Theme } from './settings/types';
import { UCLMatchdayBoardMobilePolished } from './components/generated/UCLMatchdayBoardMobilePolished';

let theme: Theme = 'light';

function App() {
  function setTheme(theme: Theme) {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  setTheme(theme);

  return (
    <>
      <UCLMatchdayBoardMobilePolished />
    </>
  ); // %EXPORT_STATEMENT%
}

export default App;
