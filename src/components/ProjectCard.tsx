'use client'

import Link from 'next/link'
import { Peg } from './Peg'
import type { Project } from '@/data/projects'

interface ProjectCardProps {
  project: Project
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Link
      href={`/projects/${project.slug}`}
      className="group relative block bg-board-card border-[1.5px] border-[#B0B0B0] rounded-card
                 p-3 cursor-pointer transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
                 shadow-card hover:shadow-card-hover hover:border-black hover:-translate-y-0.5
                 hover:z-20"
    >
      {/* Peg at top-right */}
      <Peg style={{ top: -5, right: 14 }} />

      {/* Top row: number + dot */}
      <div className="flex justify-between items-center border-b border-[#E0E0E0] pb-1.5 mb-2">
        <span className="text-[13px] font-extrabold text-black font-display">
          {project.id}
        </span>
        <div className="w-1.5 h-1.5 rounded-full bg-[#999] group-hover:bg-black transition-colors duration-300" />
      </div>

      {/* Project name */}
      <div className="text-[17px] font-extrabold text-black text-center leading-tight tracking-tight py-1 font-display">
        {project.name}
      </div>

      {/* Bottom row: View More + arrow */}
      <div className="flex justify-between items-center mt-1">
        <span className="text-[10px] text-[#999] group-hover:text-[#555] font-medium tracking-wide transition-colors duration-300">
          View More
        </span>
        <div className="w-5 h-5 rounded-full border border-[#D0D0D0] group-hover:border-[#999]
                        flex items-center justify-center transition-all duration-300
                        group-hover:translate-x-0.5">
          <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
            <path
              d="M3 1.5L7 5L3 8.5"
              className="stroke-[#BBB] group-hover:stroke-[#555] transition-colors duration-300"
              strokeWidth="1.3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </Link>
  )
}
