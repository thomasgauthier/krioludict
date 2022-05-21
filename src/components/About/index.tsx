import React from "react"
import { Modal } from "semantic-ui-react";
import style from "./About.module.scss"

const Attributions: React.FC<{ open: boolean, close: Function }> = ({ open, close }) => <Modal
    className={style.aboutModal}
    open={open}
    closeOnEscape={true}
    closeOnDimmerClick={true}
    onClose={() => close()}
    closeIcon
>
    <Modal.Header>About</Modal.Header>

    <Modal.Content>
        <Modal.Description>
            <p>
                The kriolu translations found on this website are from the <a href="https://fsi-languages.yojik.eu/languages/PeaceCorps/Kriolu.html" target="_blank" rel="noreferrer">Peace Corps English to Kriolu Dictionary</a> (public domain).
            </p>
            <object style={{ width: "100%", height: "50vh" }} data="https://fsi-languages.yojik.eu/languages/PeaceCorps/Kriolu/English-Kriolu%20Dictionary.pdf" type="application/pdf">
                <div>No online PDF viewer installed</div>
            </object>
            <p>
                If you find any errors in the translations or would like to contribute, head over to <a href="https://github.com/thomasgauthier/krioludict" target="_blank" >GitHub</a>
            </p>
        </Modal.Description>
    </Modal.Content>
</Modal>


export default Attributions;
