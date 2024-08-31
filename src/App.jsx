import { useEffect } from "react";
import Got from "./Got"

function App() {


  function MyComponent() {
    useEffect(() => {
      document.title = "Catflix";
    }, []);
  }

  return (
    <>
      <MyComponent/>
      <Got/>
    </>
  )
}

export default App
