import { Theme } from './settings/types';
import { UCLMatchdayBoardMobile } from './components/generated/UCLMatchdayBoardMobile';

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
      <UCLMatchdayBoardMobile />
    </>
  ); // %EXPORT_STATEMENT%
}

export default App;
