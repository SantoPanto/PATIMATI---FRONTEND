// jest-dom eslestiricileri (toBeInTheDocument, toHaveTextContent, ...) her test
// dosyasinda tek tek import edilmesin diye burada bir kez yukleniyor.
import '@testing-library/jest-dom/vitest'

import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Testler ayni jsdom belgesini paylasiyor. Temizlenmezse bir onceki testin
// cizdigi agac ayakta kalir ve `getByText` YANLIS dugumu bulur — bu, bekcinin
// yesil yandigi hâlde yanlis seyi olctugu sinifin en sik sebebi.
afterEach(() => {
  cleanup()
})
