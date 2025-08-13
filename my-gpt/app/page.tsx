"use client"

import { Sidebar } from '@/components/sidebar'
import { Chat } from '@/components/chat'

export default function Home() {
  function handle(){
    console.log('handled')
  }

  return (
    <div className="flex h-[calc(100vh_-_theme(spacing.16))] overflow-hidden">
      {/* <Sidebar /> */}
      <div className="group w-full overflow-auto pl-0 animate-in duration-300 ease-in-out peer-[[data-state=open]]:lg:pl-[250px] peer-[[data-state=open]]:xl:pl-[300px]">
        <Chat />
      </div>
    </div>
  )
}