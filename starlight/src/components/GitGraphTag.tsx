import GitGraphWrapper from './GitGraphWrapper'

export default function GitGraphTag() {
    return (
        <GitGraphWrapper>
            {(gitgraph) => {
                const stable = gitgraph.branch({
                    name: 'stable',
                })
                stable.commit('Initial Commit')

                const release110 = stable.branch('release-1.1.0')
                release110.commit('Initial Commit')

                stable.merge(release110)
                stable.tag('v1.1.0')

                const release120 = stable.branch('release-1.2.0')
                release120.commit('Initial Commit')
                stable.merge(release120)

                const release200 = stable.branch('release-2.0.0')
                release200.commit('Initial Commit')
                stable.merge(release200)

                // const release201 = stable.branch('release-2.0.1')
                // stable.merge(release201)
            }}
        </GitGraphWrapper>
    )
}
