import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export function Sidebar() {
  return (
    <div className="hidden w-[250px] xl:w-[300px] fixed inset-y-0 z-20 flex-col duration-300 border-r peer-[[data-state=open]]:flex sm:flex">
      <div className="flex-1 overflow-auto">
        <div className="p-2">
          <Button className="w-full justify-start gap-2">
            <Plus className="h-4 w-4" />
            New chat
          </Button>
        </div>
        {/* Chat history would go here */}
      </div>
      {/* User section would go here */}
    </div>
  )
}