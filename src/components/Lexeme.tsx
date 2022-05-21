import React, { Fragment } from "react"
import { Card, Divider, Label, List } from "semantic-ui-react";
import style from "./Lexeme.module.scss"

const Lexeme: React.FC<{ lexeme: string; definitions: { type: string; kriolu: string[]; }[]; html: string; }> = (item) => <Card className={style.card} centered={false}>
    <Card.Content>
        <Card.Header>{item.lexeme}</Card.Header>
        {item.definitions.map((def, idx) => <Fragment key={idx}>
            {idx > -1 && <Divider section className={style.divider} />}

            <Label><i><b>{def.type}</b></i></Label>

            <List className={style.definition} style={{ transform: 'translateX(calc(0.5833em / 2))' }}>
                {def.kriolu.map((k, i) =>
                    <List.Item key={`${item.lexeme}${k}${idx}${i}`}>
                        {
                            <dfn dangerouslySetInnerHTML={{ __html: k }}>

                            </dfn>
                        }
                    </List.Item>
                )}
            </List>


        </Fragment>)}

    </Card.Content>
</Card>


export default Lexeme;
