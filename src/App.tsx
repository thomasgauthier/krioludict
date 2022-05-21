import './App.css';

import { useEffect, useRef, useState } from 'react';
import { Card, Container, Divider, Icon, List, Menu, Segment } from "semantic-ui-react";
import Lexeme from './components/Lexeme';
import Fuse from "fuse.js"
import l from "./lexemes.json"
import debounce from "lodash.debounce";
import { toWords } from "number-to-words"
import { withoutDiatricts } from './utils';
import cloneDeep from 'lodash.clonedeep'
import levenshtein from 'js-levenshtein';
import useStateWithOnChange from './useStateWithPrevious';
import About from './components/About';

const ll = l as any as { [key: string]: { lexeme: string; definitions: { type: string; kriolu: string[]; }[]; html: string; } }[];

const lexemes = Object.keys(ll).map((key) => ll[key as any]) as any as { lexeme: string; definitions: { type: string; kriolu: string[]; }[]; html: string; }[]

const lexemesWithoutDiactrics = lexemes.map(val => {
  return {
    ...val,
    definitions: val.definitions.map(def => {
      return { ...def, kriolu: def.kriolu.map(k => withoutDiatricts(k)) }
    })
  }
})

const fuse = new Fuse(lexemesWithoutDiactrics, {
  keys: [{ name: "lexeme", weight: 1 }, { name: "definitions.kriolu", weight: 0.5 }],
  ignoreLocation: true,
  ignoreFieldNorm: true,
  includeMatches: true,
})

function App() {
  const currentSearchQuery = useRef('')
  const [uiQuery, setUiQUery] = useState("")
  const [aboutModalIsOpen, setAboutModalIsOpen] = useState(false)


  // const [results, setResults] = useStateWithOnChange<Fuse.FuseResult<any>[]>([{ item: lexemes.find(f => f.lexeme === 'Dictionary') } as any as Fuse.FuseResult<any>], (results: Fuse.FuseResult<any>[] | null) => {
    const [results, setResults] = useStateWithOnChange<Fuse.FuseResult<any>[]>([
      { item: lexemes.find(f => f.lexeme === 'Learn') } as any as Fuse.FuseResult<any>,
      { item: lexemes.find(f => f.lexeme === 'Creole') } as any as Fuse.FuseResult<any>,
      // { item: lexemes.find(f => f.lexeme === 'Dictionary') } as any as Fuse.FuseResult<any>
    ], (results: Fuse.FuseResult<any>[] | null) => {

    if (!results) {
      return
    }

    if (!results?.[0]?.matches) {
      return;
    }

    const underscoredResults = results.map(res => {

      const result = { ...res, item: cloneDeep(lexemes[res.refIndex]) };



      const viableMatches = result.matches!.filter(m => !!m.value).map(match => ({
        ...match, indices: match.indices.filter(([a, b]) => {
          return b - a > 2;
        }
        )
      })).filter(m => m.indices.length > 0)


      const usedGlosses = new Map<string, {
        location: { definitionIndex: number, krioluIndex: number },
        matchIndices: [number, number]
      }>()

      //it's possible that two matches have the same properties (value and indices) but represent a different match in the same lexeme (e.g. Love)
      //fusejs doesn't give us the exact path for a deep match so we we find it by comparing the strings in the definitions and match value
      viableMatches.forEach(match => {

        if (!match.value) {
          return;
        }

        match.indices.forEach(indices => {
          if (match.key === 'definitions.kriolu') {

            result.item.definitions.forEach((def, definitionIndex) => {
              def.kriolu.forEach((kriolu, krioluIndex) => {


                const matchID = `${match.value}${definitionIndex}${krioluIndex}${indices[0]}${indices[1]}`;

                if (usedGlosses.has(matchID)) {
                  return
                }

                if (withoutDiatricts(kriolu) === match.value) {
                  usedGlosses.set(matchID, {
                    location: {
                      definitionIndex,
                      krioluIndex
                    },
                    matchIndices: indices
                  })
                }
              })
            })
          }
        })
      })

      const matches = [...usedGlosses.entries()].map(([_, match]) => match).sort((a, b) => b.matchIndices[1] - a.matchIndices[1])


      matches.forEach(match => {
        const kriolu = result.item.definitions[match.location.definitionIndex].kriolu[match.location.krioluIndex];

        enum UnderscoreWriterState {
          InsideMatch,
          NotInsideMatch
        }

        const reverseQuery = [...currentSearchQuery.current!].reverse().join('')

        const gloss = ['\0', ...kriolu, '\0'];

        //creates the html gloss with underscored matches that fits our levenshtein distance criteria
        //we do it from right to left to keep the indices calculations working
        const underscored = gloss.reduceRight((acc, val, idx) => {

          const i = idx - 1;

          if (i >= match.matchIndices[0] && i <= match.matchIndices[1]) {
            acc.state = UnderscoreWriterState.InsideMatch;
            acc.currentUnderlineCandidate += val;
          }
          else {
            if (acc.state === UnderscoreWriterState.InsideMatch) { //just stepped outside a match

              const levenshteinDistance = levenshtein(reverseQuery.replace(/\s/g, ""), withoutDiatricts(acc.currentUnderlineCandidate).replace(/\s/g, "").toLowerCase());

              if (levenshteinDistance < 2) {


                const matches = [...acc.currentUnderlineCandidate].reverse().join('').match(/^(\s+)?(\p{L}+)(\s+)?$/gu);


                if (kriolu.includes('Bai-bem')) {
                  console.log(`#${[...acc.currentUnderlineCandidate].reverse().join('')}#`, matches);
                }

                const startWhitespace = acc.currentUnderlineCandidate.match(/^\s+/);

                if (startWhitespace) {
                  acc.finalGloss += startWhitespace[0]
                }

                //don't underscore leading or trailing spaces, it's ugly
                acc.finalGloss += `>u/<${acc.currentUnderlineCandidate.replace(/^\s+/, '').replace(/\s+$/, '')}>u<`

                const end = acc.currentUnderlineCandidate.match(/\s+$/);

                if (end) {
                  acc.finalGloss += end[0]
                }

                acc.currentUnderlineCandidate = ''
              } else {
                acc.finalGloss += acc.currentUnderlineCandidate
              }

            }

            acc.state = UnderscoreWriterState.NotInsideMatch;

            acc.finalGloss += val;
          }

          return acc;
        }, {
          state: UnderscoreWriterState.NotInsideMatch,
          currentUnderlineCandidate: '',
          finalGloss: ''
        })

        result.item.definitions[match.location.definitionIndex].kriolu[match.location.krioluIndex] = [...underscored.finalGloss]
          .reverse().join('')
          .substr(1, underscored.finalGloss.length - 2); //remove extra \0 characters
      })

      return result;
    })

    setResults(underscoredResults)
  }, (current: Fuse.FuseResult<any>[] | null, last: Fuse.FuseResult<any>[] | null) => {
    return current?.reduce((acc, { refIndex }) => `${acc}${refIndex}`, "") === last?.reduce((acc, { refIndex }) => `${acc}${refIndex}`, "")
  });


  useEffect(() => {
    window.scrollTo(0, 0)
  }, [results])

  const debounced = useRef(
    debounce(async (query: string) => {
      const searchQuery = withoutDiatricts(query.trim().match(/^[0-9]+$/) ? toWords(query) : query.trim()).toLowerCase();


      const newResults = cloneDeep(fuse.search(searchQuery).slice(0, 10));


      setResults(newResults);
      currentSearchQuery.current = searchQuery;
    }, 100)
  );

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Menu fixed='top'>
        <div style={{ display: "flex", flexDirection: "column", alignItems: 'center', width: "100%" }}>
          <h1 style={{ marginTop: "0.5em", fontFamily: 'Playfair Display' }}>
            English Kriolu Dictionary
          </h1>
          <Menu.Menu className="fluid" style={{ width: '100%' }}>
            <Container>
              <div style={{ margin: "1em 0" }} className="fluid">

                <div className="ui search">
                  <div className="ui fluid icon input">
                    <input autoComplete="off"
                      placeholder="Search for a word"
                      type="text"
                      tabIndex={0}
                      className="prompt"
                      value={uiQuery}
                      onChange={(e) => {
                        setUiQUery(e.target.value)
                        debounced.current(e.target.value);
                      }}
                    />
                    <Icon name={uiQuery.length ? 'delete' : 'search'}
                      link onClick={() => {
                        setUiQUery('')
                        setResults([]);
                      }} />
                  </div>
                </div>
              </div>
            </Container>
          </Menu.Menu>
        </div>
      </Menu>
      <Container style={{ marginTop: '10.162857143em' }}>


        {results && <Card.Group itemsPerRow={1}>
          {results.map(({ item }) => {
            return <Lexeme key={item.lexeme} {...item} />
          })}
        </Card.Group>}
      </Container>


      <About open={aboutModalIsOpen} close={() => setAboutModalIsOpen(false)} />

      <Segment vertical style={{ padding: '2em 0em', marginTop: 'auto' }}>
        <Divider section style={{ width: "70%", marginLeft: 'auto', marginRight: 'auto' }} />
        <Container textAlign='center'>
          <div>Made with <span style={{ color: "#e25555" }}>♥</span> in Tarrafal, Santiago</div>

          <List horizontal divided link size='large'>
            <List.Item as='a' href='#' onClick={(e) => {
              e.preventDefault();
              setAboutModalIsOpen(true);
            }}>
              About
            </List.Item>
            <List.Item as='a' target="_blank" href='https://github.com/thomasgauthier/krioludict'>
              {/* <Icon name="github" /> */}
              GitHub
            </List.Item>
          </List>
        </Container>
      </Segment>
    </div>
  );
}

export default App;
