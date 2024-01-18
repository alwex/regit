import {
    Gitgraph,
    Mode,
    Orientation,
    TemplateName,
    templateExtend,
} from '@gitgraph/react'

const template = templateExtend(TemplateName.Metro, {
    colors: ['#92d1fe', '#E44354', '#FFDD58', '#4F953D', '#B060CC'],
    branch: {
        lineWidth: 6,
        spacing: 60,
        label: {
            display: true,
            bgColor: 'transparent',
        },
    },
    commit: {
        spacing: 85,
        dot: {
            size: 8,
        },
        message: {
            font: 'normal 12pt Arial',
        },
    },
})

interface GitGraphWrapperProps {
    children: (gitgraph: any) => void
}

export default function GitGraphWrapper(props: GitGraphWrapperProps) {
    const { children } = props

    return (
        <div className="git-graph-container">
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 800 340"
                preserveAspectRatio="xMidYMin slice"
            >
                <Gitgraph
                    options={{
                        mode: Mode.Compact,
                        orientation: Orientation.Horizontal,
                        template,
                    }}
                >
                    {children}
                </Gitgraph>
            </svg>
        </div>
    )
}
